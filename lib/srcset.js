// Inlined from `parse-srcset` (https://github.com/albell/parse-srcset)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
// Based super duper closely on the reference algorithm at:
// https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
export function parseSrcset(input) {
  function isSpace(c) {
    return (c === '\u0020' || // space
      c === '\u0009' || // horizontal tab
      c === '\u000A' || // new line
      c === '\u000C' || // form feed
      c === '\u000D');  // carriage return
  }

  function collectCharacters(regEx) {
    let chars;
    const match = regEx.exec(input.substring(pos));
    if (match) {
      chars = match[0];
      pos += chars.length;
      return chars;
    }
  }

  const inputLength = input.length;
  // (Don't use \s, to avoid matching non-breaking space)
  // eslint-disable-next-line no-control-regex
  const regexLeadingSpaces = /^[ \t\n\r\u000c]+/;
  // eslint-disable-next-line no-control-regex
  const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/;
  // eslint-disable-next-line no-control-regex
  const regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/;
  const regexTrailingCommas = /[,]+$/;
  const regexNonNegativeInteger = /^\d+$/;
  const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

  let url, descriptors, currentDescriptor, state, c;
  let pos = 0;
  const candidates = [];

  while (true) {
    collectCharacters(regexLeadingCommasOrSpaces);

    if (pos >= inputLength) {
      return candidates;
    }

    url = collectCharacters(regexLeadingNotSpaces);
    descriptors = [];

    if (url.slice(-1) === ',') {
      url = url.replace(regexTrailingCommas, '');
      parseDescriptors();
    } else {
      tokenize();
    }
  }

  function tokenize() {
    collectCharacters(regexLeadingSpaces);
    currentDescriptor = '';
    state = 'in descriptor';

    while (true) {
      c = input.charAt(pos);

      if (state === 'in descriptor') {
        if (isSpace(c)) {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
            currentDescriptor = '';
            state = 'after descriptor';
          }
        } else if (c === ',') {
          pos += 1;
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }
          parseDescriptors();
          return;
        } else if (c === '(') {
          currentDescriptor = currentDescriptor + c;
          state = 'in parens';
        } else if (c === '') {
          if (currentDescriptor) {
            descriptors.push(currentDescriptor);
          }
          parseDescriptors();
          return;
        } else {
          currentDescriptor = currentDescriptor + c;
        }
      } else if (state === 'in parens') {
        if (c === ')') {
          currentDescriptor = currentDescriptor + c;
          state = 'in descriptor';
        } else if (c === '') {
          descriptors.push(currentDescriptor);
          parseDescriptors();
          return;
        } else {
          currentDescriptor = currentDescriptor + c;
        }
      } else if (state === 'after descriptor') {
        if (isSpace(c)) {
          // Stay in this state.
        } else if (c === '') {
          parseDescriptors();
          return;
        } else {
          state = 'in descriptor';
          pos -= 1;
        }
      }

      pos += 1;
    }
  }

  function parseDescriptors() {
    let pError = false;
    let w, d, h, i;
    const candidate = {};
    let desc, lastChar, value, intVal, floatVal;

    for (i = 0; i < descriptors.length; i++) {
      desc = descriptors[i];

      lastChar = desc[desc.length - 1];
      value = desc.substring(0, desc.length - 1);
      intVal = parseInt(value, 10);
      floatVal = parseFloat(value);

      if (regexNonNegativeInteger.test(value) && (lastChar === 'w')) {
        if (w || d) {
          pError = true;
        }
        if (intVal === 0) {
          pError = true;
        } else {
          w = intVal;
        }
      } else if (regexFloatingPoint.test(value) && (lastChar === 'x')) {
        if (w || d || h) {
          pError = true;
        }
        if (floatVal < 0) {
          pError = true;
        } else {
          d = floatVal;
        }
      } else if (regexNonNegativeInteger.test(value) && (lastChar === 'h')) {
        if (h || d) {
          pError = true;
        }
        if (intVal === 0) {
          pError = true;
        } else {
          h = intVal;
        }
      } else {
        pError = true;
      }
    }

    if (!pError) {
      candidate.url = url;
      if (w) {
        candidate.w = w;
      }
      if (d) {
        candidate.d = d;
      }
      if (h) {
        candidate.h = h;
      }
      candidates.push(candidate);
    } else if (typeof console !== 'undefined' && console.log) {
      console.log(
        `Invalid srcset descriptor found in '${input}' at '${desc}'.`
      );
    }
  }
}

export function stringifySrcset(parsedSrcset) {
  return parsedSrcset.map(function(part) {
    if (!part.url) {
      throw new Error('URL missing');
    }

    return (
      part.url +
      (part.w ? ` ${part.w}w` : '') +
      (part.h ? ` ${part.h}h` : '') +
      (part.d ? ` ${part.d}x` : '')
    );
  }).join(', ');
}
