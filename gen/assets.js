import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

const excludedSourceFiles = new Set();

async function walk(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.join(dir, dirent.name);
      return dirent.isDirectory() ? await walk(res) : res;
    })
  );
  return files.flat();
}

const sourceFiles = [
  ...(await walk('./src')),
  'static/json/hard_drive.json',
  'svelte.config.js',
  'tailwind.config.cjs',
  'vite.config.js'
]
  .filter((file) =>
    ['.js', '.jsx', '.json', '.svelte', '.css', '.cjs', '.html'].includes(
      path.extname(file)
    )
  )
  .filter((file) => !excludedSourceFiles.has(file));

const sourceContent = (
  await Promise.all(
    sourceFiles.map((file) => readFile(file, 'utf-8').catch(() => ''))
  )
).join('\n');

function included(asset) {
  return sourceContent.includes(path.basename(asset));
}

async function collect(dir, exts) {
  const files = await walk(dir);
  return files
    .filter((file) => exts.length === 0 || exts.includes(path.extname(file)))
    .filter((file) => included(file))
    .map((file) => file.replace(/^static/i, ''));
}

const remote_files = await collect('./static/files', ['.png', '.jpg', '.mp3']);
const images = await collect('./static/images', ['.png', '.jpg', '.svg', '.gif']);
const fonts = await collect('./static/fonts', ['.ttf']);
const audios = await collect('./static/audio', ['.mp3', '.wav']);
const empties = await collect('./static/empty', []);

const assets = { remote_files, images, audios, fonts, empties };

for (const [key, value] of Object.entries(assets)) {
  console.log(`const ${key} = ${JSON.stringify(value)};\n`);
}

