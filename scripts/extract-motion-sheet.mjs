import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const [inputPath, outputDirectory, prefix = 'enemy', labelsValue = 'run-1,run-2,attack-1,attack-2'] = process.argv.slice(2);

if (!inputPath || !outputDirectory) {
  throw new Error('Usage: node scripts/extract-motion-sheet.mjs <sheet> <out-dir> [prefix]');
}

const source = PNG.sync.read(fs.readFileSync(inputPath));
const pixelCount = source.width * source.height;

// Remove the generated flat green while retaining soft antialiased edges.
for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  const index = pixel * 4;
  const red = source.data[index];
  const green = source.data[index + 1];
  const blue = source.data[index + 2];
  const greenLead = green - Math.max(red, blue);
  const keyDistance = Math.hypot(red, 255 - green, blue);

  if (greenLead > 20 && green > 80) {
    const alpha = Math.max(0, Math.min(255, (keyDistance - 52) * 4.8));
    source.data[index + 3] = Math.min(source.data[index + 3], alpha);
    const spill = Math.max(0, green - Math.max(red, blue));
    source.data[index + 1] = Math.max(0, green - spill * (1 - alpha / 255) * 0.9);
  }
}

const visited = new Uint8Array(pixelCount);
const components = [];
const offsets = [-1, 1, -source.width, source.width];

for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  if (visited[pixel] || source.data[pixel * 4 + 3] <= 18) continue;

  const queue = [pixel];
  const pixels = [];
  visited[pixel] = 1;
  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;
  let sumX = 0;
  let sumY = 0;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const x = current % source.width;
    const y = Math.floor(current / source.width);
    pixels.push(current);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    sumX += x;
    sumY += y;

    for (const offset of offsets) {
      const next = current + offset;
      if (next < 0 || next >= pixelCount || visited[next]) continue;
      if ((offset === -1 && x === 0) || (offset === 1 && x === source.width - 1)) continue;
      if (source.data[next * 4 + 3] <= 18) continue;
      visited[next] = 1;
      queue.push(next);
    }
  }

  if (pixels.length > 500) {
    components.push({
      pixels,
      minX,
      minY,
      maxX,
      maxY,
      centerX: sumX / pixels.length,
      centerY: sumY / pixels.length,
    });
  }
}

const quadrants = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];
const labels = labelsValue.split(',').map((label) => label.trim());
if (labels.length !== 4 || labels.some((label) => !label)) {
  throw new Error('Frame labels must contain exactly four comma-separated names');
}
const selected = quadrants.map(([column, row]) => components
  .filter((component) => (
    Math.floor(component.centerX / (source.width / 2)) === column
    && Math.floor(component.centerY / (source.height / 2)) === row
  ))
  .sort((left, right) => right.pixels.length - left.pixels.length)[0]);

if (selected.some((component) => !component)) {
  throw new Error(`Could not identify four motion silhouettes in ${inputPath}`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const padding = 16;

selected.forEach((component, frameIndex) => {
  const minX = Math.max(0, component.minX - padding);
  const minY = Math.max(0, component.minY - padding);
  const maxX = Math.min(source.width - 1, component.maxX + padding);
  const maxY = Math.min(source.height - 1, component.maxY + padding);
  const output = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });

  for (const pixel of component.pixels) {
    const sourceX = pixel % source.width;
    const sourceY = Math.floor(pixel / source.width);
    const sourceIndex = pixel * 4;
    const outputIndex = ((sourceY - minY) * output.width + sourceX - minX) * 4;
    source.data.copy(output.data, outputIndex, sourceIndex, sourceIndex + 4);
  }

  const outputPath = path.join(outputDirectory, `${prefix}-${labels[frameIndex]}.png`);
  fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));

  const edgeDistances = [
    component.minX,
    component.minY,
    source.width - 1 - component.maxX,
    source.height - 1 - component.maxY,
  ];
  console.log(`${labels[frameIndex]} ${output.width}x${output.height} source-edge=${edgeDistances.join('/')}`);
});
