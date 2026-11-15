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
let frameTotal = 0;
for (const exercise of exercises) {
  const entry = media[exercise.id];
  if (!entry || entry.kind !== 'illustrated-gif' || entry.frameCount < 2) throw new Error(`Missing animation: ${exercise.id}`);
  if (entry.durations.length !== entry.frameCount || entry.durations.some(ms => !Number.isFinite(ms) || ms < 10)) throw new Error(`Invalid timing: ${exercise.id}`);
  for (const key of ['gif', 'atlas', 'poster']) {
    const file = path.join('public', entry[key]);
    if (!fs.existsSync(file) || fs.statSync(file).size < 100) throw new Error(`Missing or empty: ${file}`);
    const header = fs.readFileSync(file).subarray(0, 12).toString('ascii');
    if (key === 'gif' ? !/^GIF8[79]a/.test(header) : !(header.startsWith('RIFF') && header.endsWith('WEBP'))) throw new Error(`Invalid media: ${file}`);
  }
  frameTotal += entry.frameCount;
}
console.log(`Verified ${exercises.length} animated GIFs, ${frameTotal} frames, and all playback atlases/posters.`);
