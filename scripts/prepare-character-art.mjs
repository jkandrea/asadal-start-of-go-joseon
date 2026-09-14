import fs from 'node:fs';
import { PNG } from 'pngjs';

const [inputPath, outputPath, mode = 'trim'] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/prepare-character-art.mjs <input> <output> [chroma|trim]');
}

const source = PNG.sync.read(fs.readFileSync(inputPath));

if (mode.startsWith('chroma')) {
  for (let index = 0; index < source.data.length; index += 4) {
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


  const matte = Buffer.from(source.data);
  for (let y = 1; y < source.height - 1; y += 1) {
    for (let x = 1; x < source.width - 1; x += 1) {
      const index = (y * source.width + x) * 4;
      const red = source.data[index];
      const green = source.data[index + 1];
      const blue = source.data[index + 2];
      const dominantBase = Math.max(red, blue);
      const fringeLead = green - dominantBase;
      if (fringeLead <= 8 || green < 45) continue;

      matte[index + 1] = dominantBase;
      matte[index + 3] = Math.min(
        source.data[index + 3],
        Math.max(0, Math.round(255 - fringeLead * 2.35)),
      );
      const touchesClearPixel = [index - 4, index + 4, index - source.width * 4, index + source.width * 4]
        .some((neighbor) => source.data[neighbor + 3] < 18);
      if (touchesClearPixel) matte[index + 3] = Math.round(source.data[index + 3] * 0.2);
    }
  }
  source.data.set(matte);

  if (mode.includes('largest')) {
    const visited = new Uint8Array(source.width * source.height);
    const components = [];
    const neighbors = [-1, 1, -source.width, source.width];

    for (let pixel = 0; pixel < visited.length; pixel += 1) {
      if (visited[pixel] || source.data[pixel * 4 + 3] <= 18) continue;
      const queue = [pixel];
      const component = [];
      visited[pixel] = 1;

      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const current = queue[cursor];
        component.push(current);
        const x = current % source.width;
        for (const offset of neighbors) {
          const next = current + offset;
          if (next < 0 || next >= visited.length || visited[next]) continue;
          if ((offset === -1 && x === 0) || (offset === 1 && x === source.width - 1)) continue;
          if (source.data[next * 4 + 3] <= 18) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }
      components.push(component);
    }

    components.sort((left, right) => right.length - left.length);
    for (const component of components.slice(1)) {
      for (const pixel of component) source.data[pixel * 4 + 3] = 0;
    }
  }
}

let minX = source.width;
let minY = source.height;
let maxX = -1;
let maxY = -1;

for (let y = 0; y < source.height; y += 1) {
  for (let x = 0; x < source.width; x += 1) {
    if (source.data[(y * source.width + x) * 4 + 3] > 10) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
}

const padding = 12;
minX = Math.max(0, minX - padding);
minY = Math.max(0, minY - padding);
maxX = Math.min(source.width - 1, maxX + padding);
maxY = Math.min(source.height - 1, maxY + padding);

const output = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
PNG.bitblt(source, output, minX, minY, output.width, output.height, 0, 0);
fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));
