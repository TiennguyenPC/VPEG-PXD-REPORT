#!/usr/bin/env node
/**
 * Đẩy backend/code.gs lên Google Apps Script — không cần copy/dán tay.
 * Lần đầu: npm run gas:login (1 lần duy nhất)
 * Sau đó:  npm run gas:sync
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const claspJsonPath = path.join(backendDir, '.clasp.json');
const gasConfigPath = path.join(backendDir, 'gas.config.json');
const apiJsPath = path.join(root, 'src', 'services', 'api.js');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readGasUrl() {
  const apiJs = fs.readFileSync(apiJsPath, 'utf8');
  const match = apiJs.match(/GAS_URL\s*=\s*['"]([^'"]+)['"]/);
  return match?.[1] || '';
}

function readDeploymentId() {
  const gasConfig = readJson(gasConfigPath);
  if (gasConfig.deploymentId) return gasConfig.deploymentId;
  const gasUrl = readGasUrl();
  const match = gasUrl.match(/macros\/s\/([^/]+)/);
  return match?.[1] || '';
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: backendDir, encoding: 'utf8', stdio: opts.inherit ? 'inherit' : 'pipe', ...opts });
}

function hasClaspAuth() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const credPath = path.join(home, '.clasprc.json');
  return fs.existsSync(credPath);
}

function fetchScriptMeta(gasUrl) {
  try {
    const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=script-meta`;
    const ps = `(Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 45).Content`;
    const raw = execSync(`powershell -NoProfile -Command "${ps}"`, { encoding: 'utf8' });
    const json = JSON.parse(raw.trim());
    return json?.data?.scriptId || '';
  } catch {
    return '';
  }
}

function fetchScriptIdFromAppsScriptApi() {
  try {
    const home = process.env.USERPROFILE || process.env.HOME || '';
    const credPath = path.join(home, '.clasprc.json');
    if (!fs.existsSync(credPath)) return '';
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = creds?.tokens?.default?.access_token;
    if (!token) return '';

    const gasConfig = readJson(gasConfigPath);
    const parentId = gasConfig.spreadsheetId || '';
    const ps = `
$headers = @{ Authorization = 'Bearer ${token}' }
try {
  $r = Invoke-RestMethod -Uri 'https://script.googleapis.com/v1/projects?pageSize=100' -Headers $headers
  if ($r.projects) {
    if ('${parentId}') {
      $match = $r.projects | Where-Object { $_.parentId -eq '${parentId}' } | Select-Object -First 1
      if ($match) { $match.scriptId; exit 0 }
    }
    ($r.projects | Select-Object -First 1).scriptId
  }
} catch { exit 1 }
`;
    const out = execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
    return out.length > 20 ? out.split('\n').pop().trim() : '';
  } catch {
    return '';
  }
}

function discoverScriptIdFromClaspList() {
  try {
    const list = run('npx clasp list');
    const lines = list.split('\n').map((l) => l.trim()).filter(Boolean);
    const candidates = [];
    for (const line of lines) {
      const idx = line.lastIndexOf(' - ');
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim();
      const id = line.slice(idx + 3).trim();
      if (!id || id.length < 20) continue;
      candidates.push({ name, id });
    }
    if (!candidates.length) return '';

    const preferred = candidates.find((c) =>
      /epc|solar|vuphong|pxd|dashboard|spreadsheet|sheet/i.test(c.name)
    );
    return (preferred || candidates[0]).id;
  } catch {
    return '';
  }
}

function ensureScriptId() {
  const gasConfig = readJson(gasConfigPath);
  const claspJson = readJson(claspJsonPath);

  let scriptId =
    claspJson.scriptId ||
    gasConfig.scriptId ||
    '';

  if (!scriptId) {
    const gasUrl = readGasUrl();
    if (gasUrl) scriptId = fetchScriptMeta(gasUrl);
  }

  if (!scriptId && hasClaspAuth()) {
    scriptId = fetchScriptIdFromAppsScriptApi();
  }

  if (!scriptId && hasClaspAuth()) {
    scriptId = discoverScriptIdFromClaspList();
  }

  if (!scriptId) {
    console.error('\n❌ Chưa tìm được scriptId.\n');
    console.error('Bước A — Bật Apps Script API (1 lần):');
    console.error('  https://script.google.com/home/usersettings\n');
    console.error('Bước B — Lấy Script ID:');
    console.error('  Google Sheet → Tiện ích → Apps Script → ⚙ Cài đặt dự án → Script ID');
    console.error('  Dán vào backend/gas.config.json → "scriptId": "..."\n');
    console.error('Rồi chạy lại: npm run gas:sync\n');
    process.exit(1);
  }

  writeJson(claspJsonPath, { scriptId, rootDir: '.' });
  if (gasConfig.scriptId !== scriptId) {
    gasConfig.scriptId = scriptId;
    writeJson(gasConfigPath, gasConfig);
  }

  return scriptId;
}

function main() {
  const mode = process.argv[2] || 'sync';

  if (mode === 'login') {
    console.log(`
🔐 Đăng nhập clasp (1 lần duy nhất)
   • Giữ terminal này MỞ — đừng đóng khi trình duyệt hỏi quyền
   • Trình duyệt sẽ quay về localhost:8888 — clasp tự bắt, không cần copy URL
   • Nếu thấy "connection refused": copy TOÀN BỘ URL trên thanh địa chỉ → dán vào terminal
`);
    const result = spawnSync('npx', ['clasp', 'login'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
    });
    if ((result.status ?? 1) === 0) {
      console.log('\n✅ Đăng nhập xong. Chạy: npm run gas:sync\n');
    }
    process.exit(result.status ?? 1);
  }

  if (!hasClaspAuth()) {
    console.error('\n❌ Chưa đăng nhập clasp.');
    console.error('Chạy: npm run gas:login\n');
    process.exit(1);
  }

  const scriptId = ensureScriptId();
  console.log(`\n📜 Apps Script ID: ${scriptId}\n`);

  if (mode === 'push' || mode === 'sync') {
    console.log('⬆️  clasp push (code.gs + Triggers.js)...');
    run('npx clasp push -f', { inherit: true });
  }

  if (mode === 'deploy' || mode === 'sync') {
    const deploymentId = readDeploymentId();
    const desc = `Auto ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
    const deployCmd = deploymentId
      ? `npx clasp deploy -i ${deploymentId} --description "${desc}"`
      : `npx clasp deploy --description "${desc}"`;
    console.log('🚀 clasp deploy...');
    run(deployCmd, { inherit: true });
  }

  console.log('\n✅ Backend đã deploy — không cần copy code.gs thủ công.\n');
}

main();
