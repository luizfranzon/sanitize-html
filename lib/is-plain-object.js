// Inlined from `is-plain-object` (https://github.com/jonschlinkert/is-plain-object)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
function isPlainObjectValue(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

export function isPlainObject(o) {
  if (isPlainObjectValue(o) === false) {
    return false;
  }

  const ctor = o.constructor;
  if (ctor === undefined) {
    return true;
  }

  const prot = ctor.prototype;
  if (isPlainObjectValue(prot) === false) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(prot, 'isPrototypeOf') === false) {
    return false;
  }

  return true;
}
