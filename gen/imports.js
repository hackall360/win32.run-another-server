import path from 'node:path';
import { readdir } from 'node:fs/promises';

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

const files = (await walk('src/routes')).filter(
  (file) => path.extname(file) === '.jsx'
);

let statements = '';
for (const file of files) {
  const importPath = file.replace('src/routes/', './');
  statements += `\n  else if (url === '${importPath}') {\n    page = (await import('${importPath}')).default;\n  }`;
}

console.log(statements);

