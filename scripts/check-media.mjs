import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const flag = process.argv[i];
  if (!['--manifest', '--media-dir', '--ids'].includes(flag) || !process.argv[i + 1]) throw new Error(`Unknown/missing option: ${flag}`);
  options[flag] = process.argv[i + 1];
}
const exercises = ['exercises.ts', 'exercises.extra.ts'].flatMap(file => {
  const code = ts.transpile(fs.readFileSync(`src/data/${file}`, 'utf8'), { module: ts.ModuleKind.CommonJS });
  const module = { exports: {} };
  new Function('exports', 'require', code)(module.exports, () => ({}));
  return module.exports.exercises ?? module.exports.extraExercises;
});
const media = JSON.parse(fs.readFileSync(options['--manifest'] ?? 'src/data/exercise-media.json', 'utf8'));
const ids = options['--ids']?.split(',') ?? exercises.map(exercise => exercise.id);

// Read actual GIF image descriptors/GCE delays, including local color tables
// and arbitrary compressed-data sub-blocks. File signatures alone miss stale
// manifests, coalesced frames and timing errors.
function gifInfo(data) {
  if (!/^GIF8[79]a/.test(data.subarray(0, 6).toString('ascii'))) throw new Error('Invalid GIF signature');
  const width = data.readUInt16LE(6), height = data.readUInt16LE(8);
  let offset = 13 + (data[10] & 128 ? 3 * 2 ** ((data[10] & 7) + 1) : 0);
  let delay = 0, loop = null;
  const durations = [];
  function blocks() {
    const chunks = [];
    while (offset < data.length) {
      const count = data[offset++];
      if (!count) return Buffer.concat(chunks);
      if (offset + count > data.length) throw new Error('Truncated GIF data');
      chunks.push(data.subarray(offset, offset + count)); offset += count;
    }
    throw new Error('Unterminated GIF data');
  }
  while (offset < data.length) {
    const marker = data[offset++];
    if (marker === 0x3b) return { width, height, durations, loop };
    if (marker === 0x21) {
      const label = data[offset++];
      if (label === 0xf9) {
        if (data[offset++] !== 4) throw new Error('Invalid GIF control extension');
        delay = data.readUInt16LE(offset + 1) * 10;
        offset += 5;
      } else if (label === 0xff) {
        const size = data[offset++];
        const app = data.subarray(offset, offset + size).toString('ascii'); offset += size;
        const payload = blocks();
        if (app === 'NETSCAPE2.0' && payload[0] === 1) loop = payload.readUInt16LE(1);
      } else blocks();
    } else if (marker === 0x2c) {
      const left = data.readUInt16LE(offset), top = data.readUInt16LE(offset + 2);
      const w = data.readUInt16LE(offset + 4), h = data.readUInt16LE(offset + 6), flags = data[offset + 8];
      if (left + w > width || top + h > height) throw new Error('GIF frame outside canvas');
      offset += 9 + (flags & 128 ? 3 * 2 ** ((flags & 7) + 1) : 0);
      offset++; blocks(); durations.push(delay); delay = 0;
    } else throw new Error(`Invalid GIF marker: ${marker}`);
  }
  throw new Error('Missing GIF trailer');
}

function webpSize(data) {
  if (data.subarray(0, 4).toString() !== 'RIFF' || data.subarray(8, 12).toString() !== 'WEBP') throw new Error('Invalid WebP');
  for (let offset = 12; offset + 8 <= data.length;) {
    const type = data.subarray(offset, offset + 4).toString();
    const length = data.readUInt32LE(offset + 4), start = offset + 8;
    if (type === 'VP8L') {
      if (data[start] !== 0x2f) throw new Error('Invalid lossless WebP');
      const bits = data.readUInt32LE(start + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    if (type === 'VP8 ') return [data.readUInt16LE(start + 6) & 0x3fff, data.readUInt16LE(start + 8) & 0x3fff];
    if (type === 'VP8X') return [1 + data.readUIntLE(start + 4, 3), 1 + data.readUIntLE(start + 7, 3)];
    offset = start + length + (length & 1);
  }
  throw new Error('Missing WebP image');
}

let frameTotal = 0;
for (const id of ids) {
  const entry = media[id];
  if (!entry || entry.kind !== 'illustrated-gif' || ![10, 12, 24].includes(entry.frameCount)) throw new Error(`Expected reviewed 10/12/24-frame animation: ${id}`);
  if (entry.durations.length !== entry.frameCount || entry.durations.some(ms => !Number.isFinite(ms) || ms < 30 || ms % 10)) throw new Error(`Invalid timing: ${id}`);
  if (new Set(entry.durations).size !== 1) throw new Error(`Uneven cadence: ${id}`);
  for (const key of ['gif', 'atlas', 'poster']) {
    const file = options['--media-dir'] ? path.join(options['--media-dir'], path.basename(entry[key])) : path.join('public', entry[key]);
    if (!fs.existsSync(file) || fs.statSync(file).size < 100) throw new Error(`Missing or empty: ${file}`);
    const data = fs.readFileSync(file);
    if (key === 'gif') {
      const actual = gifInfo(data);
      if (actual.width !== entry.width || actual.height !== entry.height || actual.loop !== 0 || JSON.stringify(actual.durations) !== JSON.stringify(entry.durations)) throw new Error(`GIF/manifest mismatch: ${id}`);
    } else {
      const actual = webpSize(data);
      const expected = key === 'atlas' ? [entry.width * entry.columns, entry.height * Math.ceil(entry.frameCount / entry.columns)] : [entry.width, entry.height];
      if (actual.some((n, i) => n !== expected[i])) throw new Error(`WebP/manifest dimensions mismatch: ${file}`);
    }
  }
  frameTotal += entry.frameCount;
}
console.log(`Verified ${ids.length} actual looping GIFs, ${frameTotal} frames, encoded delays, and atlas/poster dimensions.`);
