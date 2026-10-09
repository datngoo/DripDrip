import { mkdir, cp, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..'),
  dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
const assets = ['index.html', 'styles.css', 'manifest.webmanifest', 'assets', 'src'];
for (const item of assets)
  await cp(path.join(root, item), path.join(dist, item), { recursive: true });
async function fingerprint(dir) {
  let content = '';
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const name = path.join(dir, entry.name);
    content += entry.name + (entry.isDirectory() ? await fingerprint(name) : await readFile(name));
  }
  return content;
}
const hash = createHash('sha256')
  .update(await fingerprint(path.join(root, 'src')))
  .update(await readFile(path.join(root, 'index.html')))
  .update(await readFile(path.join(root, 'styles.css')))
  .update(await readFile(path.join(root, 'sw.js')))
  .update(await readFile(path.join(root, 'manifest.webmanifest')))
  .update(await fingerprint(path.join(root, 'assets')))
  .digest('hex')
  .slice(0, 16);
await writeFile(
  path.join(dist, 'sw.js'),
  (await readFile(path.join(root, 'sw.js'), 'utf8')).replace('__BUILD_ID__', hash),
);
await writeFile(path.join(dist, '.nojekyll'), '');
console.log(`Built DripDrip ${hash} → dist/ (static, no runtime dependencies)`);
