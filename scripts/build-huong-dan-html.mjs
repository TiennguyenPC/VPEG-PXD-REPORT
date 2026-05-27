import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mdPath = join(root, 'HUONG_DAN_SU_DUNG.md');
const outPath = join(root, 'public', 'HUONG_DAN_SU_DUNG.html');
const APP_URL = 'https://vpeg-pxd-dashboard.vercel.app';

function stripEmbeddedToc(md) {
  return md.replace(/^## Mục lục\r?\n[\s\S]*?\r?\n---\r?\n/m, '');
}

function htmlToPlain(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function slugify(text) {
  return htmlToPlain(text)
    .toLowerCase()
    .normalize('NFC')
    .replace(/\./g, '')
    .replace(/[—–]/g, '-')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addHeadingIds(html) {
  const h2Headings = [];
  const withIds = html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (match, level, inner) => {
    const plain = htmlToPlain(inner);
    const id = slugify(plain);
    if (!id) return match;
    if (level === '2') h2Headings.push({ id, text: plain });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: withIds, h2Headings };
}

function fixInternalAnchorLinks(html) {
  return html.replace(/<a href="#([^"]+)">/g, (match, href) => {
    try {
      const decoded = decodeURIComponent(href);
      const id = slugify(decoded);
      return id ? `<a href="#${id}">` : match;
    } catch {
      return match;
    }
  });
}

function buildTocHtml(headings) {
  return headings
    .map(({ id, text }) => `        <li><a href="#${id}">${escapeHtml(text)}</a></li>`)
    .join('\n');
}

const mdRaw = readFileSync(mdPath, 'utf8');
const md = stripEmbeddedToc(mdRaw);

const tmpMd = join(root, 'public', '_huong_dan_tmp.md');
writeFileSync(tmpMd, md, 'utf8');

let bodyHtml = execSync(`npx -y marked "${tmpMd}"`, {
  encoding: 'utf8',
  cwd: root,
  stdio: ['ignore', 'pipe', 'inherit'],
});

try {
  unlinkSync(tmpMd);
} catch {
  // ignore
}

const { html: bodyWithIds, h2Headings } = addHeadingIds(bodyHtml);
bodyHtml = fixInternalAnchorLinks(bodyWithIds);
const tocHtml = buildTocHtml(h2Headings);

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hướng dẫn sử dụng — Dashboard VPEG-PXD</title>
  <meta name="description" content="Hướng dẫn sử dụng Dashboard VPEG-PXD từ A–Z — Vu Phong Energy Group" />
  <style>
    :root {
      --purple: #5252ff;
      --purple-light: #7373ff;
      --bg: #0a0f1a;
      --panel: #111827;
      --border: #263554;
      --text: #cbd5e1;
      --text-strong: #f1f5f9;
      --muted: #64748b;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      font-size: 15px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(10, 15, 26, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }
    .topbar a.brand {
      color: var(--purple-light);
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-decoration: none;
    }
    .topbar .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .topbar a.btn, .topbar button.btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid rgba(82, 82, 255, 0.35);
      background: rgba(82, 82, 255, 0.12);
      color: var(--purple-light);
    }
    .topbar a.btn.primary {
      background: var(--purple);
      border-color: var(--purple);
      color: #fff;
    }
    .topbar a.btn:hover, .topbar button.btn:hover { filter: brightness(1.08); }
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      max-width: 1200px;
      margin: 0 auto;
      gap: 0;
    }
    .toc {
      position: sticky;
      top: 56px;
      align-self: start;
      max-height: calc(100vh - 56px);
      overflow-y: auto;
      padding: 20px 16px 40px;
      border-right: 1px solid var(--border);
      background: rgba(17, 24, 39, 0.35);
    }
    .toc-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .toc ol {
      margin: 0;
      padding-left: 18px;
      font-size: 12px;
    }
    .toc li { margin-bottom: 6px; }
    .toc a { color: var(--text); text-decoration: none; }
    .toc a:hover { color: var(--purple-light); }
    .content {
      padding: 28px 32px 80px;
      min-width: 0;
    }
    .content h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-strong);
      margin: 0 0 0.5em;
      background: linear-gradient(135deg, #fff 0%, var(--purple-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .content h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-strong);
      margin: 2em 0 0.75em;
      padding-left: 12px;
      border-left: 4px solid var(--purple);
      scroll-margin-top: 72px;
    }
    .content h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--purple-light);
      margin: 1.4em 0 0.5em;
      scroll-margin-top: 72px;
    }
    .content h4 { color: var(--text-strong); margin: 1em 0 0.4em; scroll-margin-top: 72px; }
    .content p, .content li { color: var(--text); }
    .content ul, .content ol { padding-left: 1.3em; }
    .content li { margin-bottom: 0.35em; }
    .content strong { color: var(--text-strong); }
    .content a { color: var(--purple-light); }
    .content blockquote {
      margin: 1em 0;
      padding: 12px 16px;
      border-left: 3px solid var(--purple);
      background: rgba(82, 82, 255, 0.08);
      border-radius: 0 8px 8px 0;
      color: #94a3b8;
      font-size: 14px;
    }
    .content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2em 0;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin: 1em 0;
    }
    .content .table-wrap {
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .content th {
      background: rgba(82, 82, 255, 0.15);
      color: var(--purple-light);
      padding: 8px 10px;
      border: 1px solid var(--border);
      text-align: left;
      white-space: nowrap;
    }
    .content td {
      padding: 8px 10px;
      border: 1px solid var(--border);
      vertical-align: top;
    }
    .content code {
      background: rgba(82, 82, 255, 0.12);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #e2e8f0;
      word-break: break-word;
    }
    .content input[type="checkbox"] {
      margin-right: 8px;
      accent-color: var(--purple);
    }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .toc {
        position: static;
        max-height: none;
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
      .content { padding: 20px 16px 60px; }
    }
    @media print {
      body { background: #fff; color: #111; }
      .topbar, .toc { display: none; }
      .layout { display: block; max-width: none; }
      .content { padding: 0; }
      .content h1, .content h2, .content h3, .content strong { color: #111; -webkit-text-fill-color: #111; }
      .content p, .content li { color: #222; }
      .content a { color: #333; }
      .content th { background: #eee; color: #111; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" id="app-home" href="${APP_URL}/">VPEG-PXD</a>
    <div class="actions">
      <a class="btn primary" id="app-dashboard" href="${APP_URL}/">Về Dashboard</a>
      <button class="btn" type="button" onclick="window.print()">In / PDF</button>
    </div>
  </header>
  <div class="layout">
    <nav class="toc" aria-label="Mục lục">
      <div class="toc-title">Mục lục</div>
      <ol>
${tocHtml}
      </ol>
    </nav>
    <main class="content">
      ${bodyHtml.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')}
    </main>
  </div>
  <script>
    (function () {
      var appUrl = ${JSON.stringify(APP_URL)};
      if (location.protocol !== 'file:') {
        var home = document.getElementById('app-home');
        var dash = document.getElementById('app-dashboard');
        if (home) home.href = '/';
        if (dash) dash.href = '/';
      }
    })();
  </script>
</body>
</html>`;

writeFileSync(outPath, html, 'utf8');
console.log('Wrote', outPath, `(${h2Headings.length} sections)`);
