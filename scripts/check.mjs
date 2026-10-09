import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for (const folder of ['src', 'scripts'])
  for (const file of await readdir(folder)) {
    if (!/\.(m?js)$/.test(file)) continue;
    const r = spawnSync(process.execPath, ['--check', `${folder}/${file}`], { stdio: 'inherit' });
    if (r.status) process.exit(r.status);
  }
const result = spawnSync(process.execPath, ['--check', 'sw.js'], { stdio: 'inherit' });
if (result.status) process.exit(result.status);
console.log('All JavaScript syntax checks passed.');
