import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const assetDirectory = path.resolve('public/assets');
const enemyFiles = fs.readdirSync(assetDirectory)
  .filter((fileName) => /^enemy-.*\.png$/i.test(fileName))
  .sort();

const isKeyGreen = (red, green, blue) => (
  green >= 18
  && green - Math.max(red, blue) >= 14
  && red <= green * 0.58
  && blue <= green * 0.72
);

const cleanImage = (filePath) => {
  const png = PNG.sync.read(fs.readFileSync(filePath));
  const { width, height, data } = png;
  let removed = 0;
  let despilled = 0;

  // The generated motion sheets were already transparent, but thin, pure-green
  // filaments remained around hair, cloth and weapons. These pixels are much more
  // saturated than any intentional tribe costume color, so remove them first.
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    if (alpha > 0 && isKeyGreen(red, green, blue)) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
      removed += 1;
    }
  }

  const touchesTransparency = (x, y, radius = 2) => {
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        if (Math.abs(offsetX) + Math.abs(offsetY) > radius) continue;
        const sampleX = x + offsetX;
        const sampleY = y + offsetY;
        if (sampleX < 0 || sampleY < 0 || sampleX >= width || sampleY >= height) return true;
        if (data[(sampleY * width + sampleX) * 4 + 3] < 18) return true;
      }
    }
    return false;
  };

  // Neutralize mixed green anti-aliasing only on the newly exposed silhouette
  // edge. Interior greens (notably the snake tribe's cloth) remain untouched.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 18 || !touchesTransparency(x, y)) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const neutralGreen = Math.max(red, blue);
      if (green - neutralGreen >= 7) {
        data[index + 1] = neutralGreen;
        despilled += 1;
      }
    }
  }

  if (removed > 0 || despilled > 0) {
    fs.writeFileSync(filePath, PNG.sync.write(png));
  }

  return { removed, despilled };
};

let totalRemoved = 0;
let totalDespilled = 0;
let changedFiles = 0;

for (const fileName of enemyFiles) {
  const result = cleanImage(path.join(assetDirectory, fileName));
  if (result.removed > 0 || result.despilled > 0) {
    changedFiles += 1;
    totalRemoved += result.removed;
    totalDespilled += result.despilled;
    console.log(`${fileName}: removed ${result.removed}, despilled ${result.despilled}`);
  }
}

console.log(`Cleaned ${changedFiles}/${enemyFiles.length} enemy PNGs; removed ${totalRemoved} green pixels and despilled ${totalDespilled} edge pixels.`);
