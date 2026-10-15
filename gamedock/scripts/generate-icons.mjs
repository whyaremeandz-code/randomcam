import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const icon = fileURLToPath(new URL('../public/icon.svg', import.meta.url));
const publicDirectory = new URL('../public/', import.meta.url);
await mkdir(publicDirectory, { recursive: true });

for (const size of [192, 512, 1024]) {
  const outputPath = fileURLToPath(new URL(`../public/icon-${size}.png`, import.meta.url));
  await sharp(icon).resize(size, size).png().toFile(outputPath);
}

const nativeIconDirectory = new URL('../ios/App/App/Assets.xcassets/AppIcon.appiconset/', import.meta.url);
try {
  await mkdir(nativeIconDirectory, { recursive: true });
  const nativeIcon = fileURLToPath(new URL('../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', import.meta.url));
  await sharp(icon).resize(1024, 1024).png().toFile(nativeIcon);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}