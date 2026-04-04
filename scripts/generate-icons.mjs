import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const svgTemplate = (size) => {
  const pad = size * 0.1;
  const r = size * 0.18;
  const cx = size / 2;
  const cy = size / 2;

  // Spade path scaled to size (proportional to 512)
  const s = size / 512;
  const tx = cx - 256 * s;
  const ty = cy - 256 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background rounded rect -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#080810"/>

  <!-- Gold glow circle behind spade -->
  <radialGradient id="glow" cx="50%" cy="45%" r="45%">
    <stop offset="0%" stop-color="#d4a017" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#d4a017" stop-opacity="0"/>
  </radialGradient>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#glow)"/>

  <!-- Spade symbol -->
  <g transform="translate(${tx}, ${ty}) scale(${s})">
    <!-- Main spade body -->
    <path d="M256 80 C256 80 80 200 80 310 C80 370 130 400 190 390 C170 430 150 460 120 480 L392 480 C362 460 342 430 322 390 C382 400 432 370 432 310 C432 200 256 80 256 80 Z"
      fill="#d4a017"/>
    <!-- Subtle inner gradient -->
    <path d="M256 110 C256 110 105 220 105 310 C105 358 145 383 195 375 C175 415 158 445 130 465 L382 465 C354 445 337 415 317 375 C367 383 407 358 407 310 C407 220 256 110 256 110 Z"
      fill="#f5c842" opacity="0.3"/>
  </g>
</svg>`;
};

for (const size of [192, 512]) {
  const svg = Buffer.from(svgTemplate(size));
  await sharp(svg).png().toFile(join(outDir, `icon-${size}.png`));
  console.log(`✅ icon-${size}.png`);
}

console.log("Done! Icons saved to public/icons/");
