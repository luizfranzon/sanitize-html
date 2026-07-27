// Inlined from `escape-string-regexp` (https://github.com/sindresorhus/escape-string-regexp)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
export function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d');
}
