export function normalizePath(path, caseTransform = s => s) {
  let p = path.replace(/\\/g, '/');
  const parts = [];
  for (const part of p.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      parts.pop();
      continue;
    }
    parts.push(caseTransform(part));
  }
  return '/' + parts.join('/');
}

export function splitPath(normalizedPath) {
  return normalizedPath.split('/').filter(Boolean);
}
