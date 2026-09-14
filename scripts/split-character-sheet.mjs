import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const [inputPath, outputDirectory, prefix = 'frame', columnsValue = '2', rowsValue = '2'] = process.argv.slice(2);

if (!inputPath || !outputDirectory) {
  throw new Error('Usage: node scripts/split-character-sheet.mjs <sheet> <out-dir> [prefix] [columns] [rows]');
}

const sheet = PNG.sync.read(fs.readFileSync(inputPath));
const columns = Number(columnsValue);
const rows = Number(rowsValue);
const cellWidth = Math.floor(sheet.width / columns);
const cellHeight = Math.floor(sheet.height / rows);

fs.mkdirSync(outputDirectory, { recursive: true });

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const frame = new PNG({ width: cellWidth, height: cellHeight });
    PNG.bitblt(sheet, frame, column * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0);
    const frameNumber = row * columns + column + 1;
    const outputPath = path.join(outputDirectory, `${prefix}-${frameNumber}-key.png`);
    fs.writeFileSync(outputPath, PNG.sync.write(frame, { colorType: 6 }));
  }
}
