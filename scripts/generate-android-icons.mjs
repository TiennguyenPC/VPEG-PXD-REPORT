/**
 * Sinh icon launcher Android từ logo Vu Phong (logo-vuphong-sun.png)
 * Chạy: node scripts/generate-android-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'assets', 'logo-vuphong-sun.png');
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

/** Nền icon — khớp logo (đen) và theme app */
const BG = { r: 6, g: 10, b: 19, alpha: 255 }; // #060a13

const DENSITIES = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function compositeIcon(size, logoScale = 0.82) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  const offset = Math.round((size - logoSize) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png();
}

async function compositeForeground(size) {
  const safe = Math.round(size * 0.72);
  const logo = await sharp(SRC)
    .resize(safe, safe, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const offset = Math.round((size - safe) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: logo, left: offset, top: offset }]);
}

async function writePng(pipeline, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await pipeline.png().toFile(dest);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Không tìm thấy:', SRC);
    process.exit(1);
  }

  for (const [folder, { launcher, foreground }] of Object.entries(DENSITIES)) {
    const dir = path.join(ANDROID_RES, folder);
    const launcherPng = await compositeIcon(launcher);
    const fgPng = await compositeForeground(foreground);

    await writePng(launcherPng, path.join(dir, 'ic_launcher.png'));
    await writePng(launcherPng, path.join(dir, 'ic_launcher_round.png'));
    await writePng(fgPng, path.join(dir, 'ic_launcher_foreground.png'));
    console.log(`✓ ${folder} (${launcher}px / fg ${foreground}px)`);
  }

  const splashDir = path.join(ANDROID_RES, 'drawable');
  const splash = await compositeIcon(512, 0.75);
  await writePng(splash, path.join(splashDir, 'splash.png'));
  console.log('✓ drawable/splash.png');

  console.log('\nXong. Chạy: npm run android:apk');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
