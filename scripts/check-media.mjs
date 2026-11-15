import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const exercises = ['exercises.ts', 'exercises.extra.ts'].flatMap(file => {
  const code = ts.transpile(fs.readFileSync(`src/data/${file}`, 'utf8'), { module: ts.ModuleKind.CommonJS });
  const module = { exports: {} };
  new Function('exports', 'require', code)(module.exports, () => ({}));
  return module.exports.exercises ?? module.exports.extraExercises;
});
const media = JSON.parse(fs.readFileSync('src/data/exercise-media.json', 'utf8'));
let frames = 0;
for (const exercise of exercises) {
  const entry = media[exercise.id];
  if (!entry?.frames?.length) throw new Error(`Missing media: ${exercise.id}`);
  for (const frame of entry.frames) {
    const file = path.join('public', frame);
    if (!fs.existsSync(file) || fs.statSync(file).size < 1000) throw new Error(`Missing or empty: ${file}`);
    const head = fs.readFileSync(file).subarray(0, 8);
    if (!(head[0] === 0xff && head[1] === 0xd8) && head.toString('hex') !== '89504e470d0a1a0a') throw new Error(`Invalid image: ${file}`);
    frames++;
  }
}
console.log(`Verified ${exercises.length} exercises and ${frames} local images.`);
