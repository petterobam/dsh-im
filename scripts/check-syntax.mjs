import { readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && /\.m?js$/u.test(entry.name)) files.push(path);
  }
  return files;
}

const files = [];
for (const directory of ['bin', 'plugin-src', 'scripts', 'src']) {
  try {
    if ((await stat(resolve(root, directory))).isDirectory()) {
      files.push(...await walk(resolve(root, directory)));
    }
  } catch {
    // Optional directory.
  }
}

for (const file of files.sort()) {
  execFileSync(process.execPath, ['--check', file], { stdio: ['ignore', 'pipe', 'pipe'] });
}
console.log(`Checked ${files.length} JavaScript files.`);
