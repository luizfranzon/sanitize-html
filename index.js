import * as htmlparser from 'htmlparser2';
import { parse as postcssParse } from 'postcss';

// Inlined from `is-plain-object` (https://github.com/jonschlinkert/is-plain-object)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
function isPlainObjectValue(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function isPlainObject(o) {
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

// Inlined from `escape-string-regexp` (https://github.com/sindresorhus/escape-string-regexp)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  return string
    .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    .replace(/-/g, '\\x2d');
}

// Inlined from `deepmerge` (https://github.com/TehShrike/deepmerge)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
function deepmergeIsMergeableObject(value) {
  return deepmergeIsNonNullObject(value) && !deepmergeIsSpecial(value);
}

function deepmergeIsNonNullObject(value) {
  return !!value && typeof value === 'object';
}

function deepmergeIsSpecial(value) {
  const stringValue = Object.prototype.toString.call(value);
  return stringValue === '[object RegExp]' || stringValue === '[object Date]';
}

function deepmergeEmptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}

function deepmergeCloneUnlessOtherwiseSpecified(value, options) {
  return (options.clone !== false && options.isMergeableObject(value))
    ? deepmerge(deepmergeEmptyTarget(value), value, options)
    : value;
}

function deepmergeDefaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return deepmergeCloneUnlessOtherwiseSpecified(element, options);
  });
}

function deepmergeGetKeys(target) {
  return Object.keys(target).concat(
    Object.getOwnPropertySymbols
      ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
      })
      : []
  );
}

function deepmergePropertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch {
    return false;
  }
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function deepmergePropertyIsUnsafe(target, key) {
  return deepmergePropertyIsOnObject(target, key) &&
    !(
      Object.hasOwnProperty.call(target, key) &&
      Object.propertyIsEnumerable.call(target, key)
    );
}

function deepmergeMergeObject(target, source, options) {
  const destination = {};
  if (options.isMergeableObject(target)) {
    deepmergeGetKeys(target).forEach(function (key) {
      destination[key] = deepmergeCloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  deepmergeGetKeys(source).forEach(function (key) {
    if (deepmergePropertyIsUnsafe(target, key)) {
      return;
    }
    const targetHasMergeableSource = deepmergePropertyIsOnObject(target, key) &&
      options.isMergeableObject(source[key]);
    if (targetHasMergeableSource) {
      destination[key] = deepmerge(target[key], source[key], options);
    } else {
      destination[key] = deepmergeCloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}

function deepmerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || deepmergeDefaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || deepmergeIsMergeableObject;

  const sourceIsArray = Array.isArray(source);
  const targetIsArray = Array.isArray(target);
  const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return deepmergeCloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return deepmergeMergeObject(target, source, options);
  }
}

// Inlined from `parse-srcset` (https://github.com/albell/parse-srcset)
// to avoid a CommonJS-only dependency that defeats ESM-only bundling.
// Based super duper closely on the reference algorithm at:
// https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
function parseSrcset(input) {
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

// Inlined from `launder` (https://github.com/apostrophecms/apostrophe/tree/main/packages/launder)
// to avoid pulling in a CommonJS dependency (and its own CJS `dayjs` dependency),
// which defeats ESM-only bundling. Kept in sync manually; it is a small, stable function.
//
// Strip characters browsers ignore inside URLs (control chars and
// embedded HTML comments) that are commonly used to sneak XSS
// payloads past simple scheme checks.
function launderCleanHref(href) {
  // eslint-disable-next-line no-control-regex
  href = href.replace(/[\x00-\x20]+/g, '');
  while (true) {
    const firstIndex = href.indexOf('<!--');
    if (firstIndex === -1) {
      break;
    }
    const lastIndex = href.indexOf('-->', firstIndex + 4);
    if (lastIndex === -1) {
      break;
    }
    href = href.substring(0, firstIndex) + href.substring(lastIndex + 3);
  }
  return href;
}

// Returns true if `href` should be rejected as unsafe.
function launderNaughtyHref(href, options) {
  options = options || {};
  const allowedSchemes = options.allowedSchemes ||
    [ 'http', 'https', 'ftp', 'mailto', 'tel', 'sms' ];
  const allowProtocolRelative = (options.allowProtocolRelative !== false);
  if (typeof href !== 'string') {
    return false;
  }
  href = launderCleanHref(href);
  const matches = href.match(/^([a-zA-Z][a-zA-Z0-9.\-+]*):/);
  if (!matches) {
    if (href.match(/^[/\\]{2}/)) {
      return !allowProtocolRelative;
    }
    return false;
  }
  const scheme = matches[1].toLowerCase();
  return allowedSchemes.indexOf(scheme) === -1;
}
// Tags that can conceivably represent stand-alone media.
const mediaTags = [
  'img', 'audio', 'video', 'picture', 'svg',
  'object', 'map', 'iframe', 'embed'
];
// Tags that are inherently vulnerable to being used in XSS attacks.
const vulnerableTags = [ 'script', 'style' ];

function each(obj, cb) {
  if (obj) {
    Object.keys(obj).forEach(function (key) {
      cb(obj[key], key);
    });
  }
}

// Avoid false positives with .__proto__, .hasOwnProperty, etc.
function has(obj, key) {
  return ({}).hasOwnProperty.call(obj, key);
}

// Returns those elements of `a` for which `cb(a)` returns truthy
function filter(a, cb) {
  const n = [];
  each(a, function(v) {
    if (cb(v)) {
      n.push(v);
    }
  });
  return n;
}

function isEmptyObject(obj) {
  for (const key in obj) {
    if (has(obj, key)) {
      return false;
    }
  }
  return true;
}

function stringifySrcset(parsedSrcset) {
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

export default sanitizeHtml;

// A valid attribute name.
// We use a tolerant definition based on the set of strings defined by
// html.spec.whatwg.org/multipage/parsing.html#before-attribute-name-state
// and html.spec.whatwg.org/multipage/parsing.html#attribute-name-state .
// The characters accepted are ones which can be appended to the attribute
// name buffer without triggering a parse error:
//   * unexpected-equals-sign-before-attribute-name
//   * unexpected-null-character
//   * unexpected-character-in-attribute-name
// We exclude the empty string because it's impossible to get to the after
// attribute name state with an empty attribute name buffer.
const VALID_HTML_ATTRIBUTE_NAME = /^[^\0\t\n\f\r /<=>]+$/;

// Ignore the _recursing flag; it's there for recursive
// invocation as a guard against this exploit:
// https://github.com/fb55/htmlparser2/issues/105

function sanitizeHtml(html, options, _recursing) {
  if (html == null) {
    return '';
  }
  if (typeof html === 'number') {
    html = html.toString();
  }

  let result = '';
  // Used for hot swapping the result variable with an empty string
  // in order to "capture" the text written to it.
  let tempResult = '';

  function Frame(tag, attribs) {
    const that = this;
    this.tag = tag;
    this.attribs = attribs || {};
    this.tagPosition = result.length;
    this.text = ''; // Node inner text
    this.openingTagLength = 0;
    this.mediaChildren = [];

    this.updateParentNodeText = function() {
      if (stack.length) {
        const parentFrame = stack[stack.length - 1];
        parentFrame.text += that.text;
      }
    };

    this.updateParentNodeMediaChildren = function() {
      if (stack.length && mediaTags.includes(this.tag)) {
        const parentFrame = stack[stack.length - 1];
        parentFrame.mediaChildren.push(this.tag);
      }
    };
  }

  options = Object.assign({}, sanitizeHtml.defaults, options);
  options.parser = Object.assign({}, htmlParserDefaults, options.parser);

  const tagAllowed = function (name) {
    return options.allowedTags === false ||
      (options.allowedTags || []).indexOf(name) > -1;
  };

  // vulnerableTags
  vulnerableTags.forEach(function (tag) {
    if (tagAllowed(tag) && !options.allowVulnerableTags) {
      console.warn(`\n\n⚠️ Your \`allowedTags\` option includes, \`${tag}\`, which is inherently\nvulnerable to XSS attacks. Please remove it from \`allowedTags\`.\nOr, to disable this warning, add the \`allowVulnerableTags\` option\nand ensure you are accounting for this risk.\n\n`);
    }
  });

  // Tags that contain something other than HTML, or where discarding
  // the text when the tag is disallowed makes sense for other reasons.
  // If we are not allowing these tags, we should drop their content too.
  // For other tags you would drop the tag but keep its content.
  // `xmp` is included because htmlparser2 treats it as a raw-text element,
  // so markup inside is parsed as text on input but would otherwise be
  // re-emitted unescaped via the `ontext` branch below, allowing XSS bypass
  // when `xmp` is disallowed (which is the default).
  const nonTextTagsArray = options.nonTextTags || [
    'script',
    'style',
    'textarea',
    'option',
    'xmp'
  ];
  let allowedAttributesMap;
  let allowedAttributesGlobMap;
  if (options.allowedAttributes) {
    allowedAttributesMap = {};
    allowedAttributesGlobMap = {};
    each(options.allowedAttributes, function(attributes, tag) {
      allowedAttributesMap[tag] = [];
      const globRegex = [];
      attributes.forEach(function(obj) {
        if (typeof obj === 'string' && obj.indexOf('*') >= 0) {
          globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, '.*'));
        } else {
          allowedAttributesMap[tag].push(obj);
        }
      });
      if (globRegex.length) {
        allowedAttributesGlobMap[tag] = new RegExp('^(' + globRegex.join('|') + ')$');
      }
    });
  }
  const allowedClassesMap = {};
  const allowedClassesGlobMap = {};
  const allowedClassesRegexMap = {};
  each(options.allowedClasses, function(classes, tag) {
    // Implicitly allows the class attribute
    if (allowedAttributesMap) {
      if (!has(allowedAttributesMap, tag)) {
        allowedAttributesMap[tag] = [];
      }
      allowedAttributesMap[tag].push('class');
    }

    allowedClassesMap[tag] = classes;

    if (Array.isArray(classes)) {
      const globRegex = [];
      allowedClassesMap[tag] = [];
      allowedClassesRegexMap[tag] = [];
      classes.forEach(function(obj) {
        if (typeof obj === 'string' && obj.indexOf('*') >= 0) {
          globRegex.push(escapeStringRegexp(obj).replace(/\\\*/g, '.*'));
        } else if (obj instanceof RegExp) {
          allowedClassesRegexMap[tag].push(obj);
        } else {
          allowedClassesMap[tag].push(obj);
        }
      });
      if (globRegex.length) {
        allowedClassesGlobMap[tag] = new RegExp('^(' + globRegex.join('|') + ')$');
      }
    }
  });

  const transformTagsMap = {};
  let transformTagsAll;
  each(options.transformTags, function(transform, tag) {
    let transFun;
    if (typeof transform === 'function') {
      transFun = transform;
    } else if (typeof transform === 'string') {
      transFun = sanitizeHtml.simpleTransform(transform);
    }
    if (tag === '*') {
      transformTagsAll = transFun;
    } else {
      transformTagsMap[tag] = transFun;
    }
  });

  let depth;
  let stack;
  let skipMap;
  let transformMap;
  let skipText;
  let skipTextDepth;
  let addedText = false;

  initializeState();

  const parser = new htmlparser.Parser({
    onopentag: function(name, attribs) {
      if (options.onOpenTag) {
        options.onOpenTag(name, attribs);
      }

      // If `enforceHtmlBoundary` is `true` and this has found the opening
      // `html` tag, reset the state.
      if (options.enforceHtmlBoundary && name === 'html') {
        initializeState();
      }

      if (skipText) {
        skipTextDepth++;
        return;
      }
      const frame = new Frame(name, attribs);
      stack.push(frame);

      let skip = false;
      const hasText = !!frame.text;
      let transformedTag;
      if (has(transformTagsMap, name)) {
        transformedTag = transformTagsMap[name](name, attribs);

        frame.attribs = attribs = transformedTag.attribs;

        if (transformedTag.text !== undefined) {
          frame.innerText = transformedTag.text;
        }

        if (name !== transformedTag.tagName) {
          frame.name = name = transformedTag.tagName;
          transformMap[depth] = transformedTag.tagName;
        }
      }
      if (transformTagsAll) {
        transformedTag = transformTagsAll(name, attribs);

        frame.attribs = attribs = transformedTag.attribs;
        if (name !== transformedTag.tagName) {
          frame.name = name = transformedTag.tagName;
          transformMap[depth] = transformedTag.tagName;
        }
      }

      if (!tagAllowed(name) || (options.disallowedTagsMode === 'recursiveEscape' && !isEmptyObject(skipMap)) || (options.nestingLimit != null && depth >= options.nestingLimit)) {
        skip = true;
        skipMap[depth] = true;
        if (options.disallowedTagsMode === 'discard' || options.disallowedTagsMode === 'completelyDiscard') {
          if (nonTextTagsArray.indexOf(name) !== -1) {
            skipText = true;
            skipTextDepth = 1;
          }
        }
      }
      depth++;
      if (skip) {
        if (options.disallowedTagsMode === 'discard' || options.disallowedTagsMode === 'completelyDiscard') {
          // We want the contents but not this tag
          if (frame.innerText && !hasText) {
            const escaped = escapeHtml(frame.innerText);
            if (options.textFilter) {
              result += options.textFilter(escaped, name);
            } else {
              result += escaped;
            }
            addedText = true;
          }
          return;
        }
        tempResult = result;
        result = '';
      }
      result += '<' + name;

      if (name === 'script') {
        if (options.allowedScriptHostnames || options.allowedScriptDomains) {
          frame.innerText = '';
        }
      }

      const isBeingEscaped = skip && (options.disallowedTagsMode === 'escape' || options.disallowedTagsMode === 'recursiveEscape');
      const shouldPreserveEscapedAttributes = isBeingEscaped &&
        options.preserveEscapedAttributes;

      if (shouldPreserveEscapedAttributes) {
        each(attribs, function(value, a) {
          result += ' ' + a + '="' + escapeHtml((value || ''), true) + '"';
        });
      } else if (!allowedAttributesMap || has(allowedAttributesMap, name) || allowedAttributesMap['*']) {
        each(attribs, function(value, a) {
          if (!VALID_HTML_ATTRIBUTE_NAME.test(a)) {
            // This prevents part of an attribute name in the output from being
            // interpreted as the end of an attribute, or end of a tag.
            delete frame.attribs[a];
            return;
          }
          // If the value is empty, check if the attribute is
          // in the allowedEmptyAttributes array.
          // If it is not in the allowedEmptyAttributes array,
          // and it is a known non-boolean attribute, delete it
          // List taken from https://html.spec.whatwg.org/multipage/indices.html#attributes-3
          if (value === '' && (!options.allowedEmptyAttributes.includes(a)) &&
            (options.nonBooleanAttributes.includes(a) || options.nonBooleanAttributes.includes('*'))) {
            delete frame.attribs[a];
            return;
          }
          // check allowedAttributesMap for the element and attribute and modify the value
          // as necessary if there are specific values defined.
          let passedAllowedAttributesMapCheck = false;
          if (!allowedAttributesMap ||
            (has(allowedAttributesMap, name) &&
              allowedAttributesMap[name].indexOf(a) !== -1) ||
            (allowedAttributesMap['*'] && allowedAttributesMap['*'].indexOf(a) !== -1) ||
            (has(allowedAttributesGlobMap, name) &&
              allowedAttributesGlobMap[name].test(a)) ||
            (allowedAttributesGlobMap['*'] && allowedAttributesGlobMap['*'].test(a))) {
            passedAllowedAttributesMapCheck = true;
          } else if (allowedAttributesMap && allowedAttributesMap[name]) {
            for (const o of allowedAttributesMap[name]) {
              if (isPlainObject(o) && o.name && (o.name === a)) {
                passedAllowedAttributesMapCheck = true;
                let newValue = '';
                if (o.multiple === true) {
                  // verify the values that are allowed
                  const splitStrArray = value.split(' ');
                  for (const s of splitStrArray) {
                    if (o.values.indexOf(s) !== -1) {
                      if (newValue === '') {
                        newValue = s;
                      } else {
                        newValue += ' ' + s;
                      }
                    }
                  }
                } else if (o.values.indexOf(value) >= 0) {
                  // verified an allowed value matches the entire attribute value
                  newValue = value;
                }
                value = newValue;
              }
            }
          }
          if (passedAllowedAttributesMapCheck) {
            if (options.allowedSchemesAppliedToAttributes.indexOf(a) !== -1) {
              if (naughtyHref(name, value)) {
                delete frame.attribs[a];
                return;
              }
            }

            if (name === 'script' && a === 'src') {

              let allowed = true;

              try {
                const parsed = parseUrl(value);

                if (options.allowedScriptHostnames || options.allowedScriptDomains) {
                  const allowedHostname = (options.allowedScriptHostnames || [])
                    .find(function (hostname) {
                      return hostname === parsed.url.hostname;
                    });
                  const allowedDomain = (options.allowedScriptDomains || [])
                    .find(function(domain) {
                      return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                    });
                  allowed = allowedHostname || allowedDomain;
                }
              } catch (e) {
                allowed = false;
              }

              if (!allowed) {
                delete frame.attribs[a];
                return;
              }
            }

            if (name === 'iframe' && a === 'src') {
              let allowed = true;
              try {
                const parsed = parseUrl(value);

                if (parsed.isRelativeUrl) {
                  // default value of allowIframeRelativeUrls is true
                  // unless allowedIframeHostnames or allowedIframeDomains specified
                  allowed = has(options, 'allowIframeRelativeUrls')
                    ? options.allowIframeRelativeUrls
                    : (!options.allowedIframeHostnames && !options.allowedIframeDomains);
                } else if (
                  options.allowedIframeHostnames ||
                  options.allowedIframeDomains
                ) {
                  const allowedHostname = (options.allowedIframeHostnames || [])
                    .find(function (hostname) {
                      return hostname === parsed.url.hostname;
                    });
                  const allowedDomain = (options.allowedIframeDomains || [])
                    .find(function(domain) {
                      return parsed.url.hostname === domain || parsed.url.hostname.endsWith(`.${domain}`);
                    });
                  allowed = allowedHostname || allowedDomain;
                }
              } catch (e) {
                // Unparseable iframe src
                allowed = false;
              }
              if (!allowed) {
                delete frame.attribs[a];
                return;
              }
            }
            if (a === 'srcset' || a === 'imagesrcset') {
              try {
                let parsed = parseSrcset(value);
                parsed.forEach(function(value) {
                  if (naughtyHref(a, value.url)) {
                    value.evil = true;
                  }
                });
                parsed = filter(parsed, function(v) {
                  return !v.evil;
                });
                if (!parsed.length) {
                  delete frame.attribs[a];
                  return;
                } else {
                  value = stringifySrcset(filter(parsed, function(v) {
                    return !v.evil;
                  }));
                  frame.attribs[a] = value;
                }
              } catch (e) {
                // Unparseable srcset
                delete frame.attribs[a];
                return;
              }
            }
            if (a === 'class') {
              const allowedSpecificClasses = allowedClassesMap[name];
              const allowedWildcardClasses = allowedClassesMap['*'];
              const allowedSpecificClassesGlob = allowedClassesGlobMap[name];
              const allowedSpecificClassesRegex = allowedClassesRegexMap[name];
              const allowedWildcardClassesRegex = allowedClassesRegexMap['*'];
              const allowedWildcardClassesGlob = allowedClassesGlobMap['*'];
              const allowedClassesGlobs = [
                allowedSpecificClassesGlob,
                allowedWildcardClassesGlob
              ]
                .concat(allowedSpecificClassesRegex, allowedWildcardClassesRegex)
                .filter(function (t) {
                  return t;
                });
              if (allowedSpecificClasses && allowedWildcardClasses) {
                value = filterClasses(
                  value,
                  deepmerge(allowedSpecificClasses, allowedWildcardClasses),
                  allowedClassesGlobs
                );
              } else {
                value = filterClasses(
                  value,
                  allowedSpecificClasses || allowedWildcardClasses,
                  allowedClassesGlobs
                );
              }
              if (!value.length) {
                delete frame.attribs[a];
                return;
              }
            }
            if (a === 'style') {
              if (options.parseStyleAttributes) {
                try {
                  const abstractSyntaxTree = postcssParse(name + ' {' + value + '}', { map: false });
                  const filteredAST = filterCss(
                    abstractSyntaxTree,
                    options.allowedStyles
                  );

                  value = stringifyStyleAttributes(filteredAST);

                  if (value.length === 0) {
                    delete frame.attribs[a];
                    return;
                  }
                } catch (e) {
                  if (typeof window !== 'undefined') {
                    console.warn('Failed to parse "' + name + ' {' + value + '}' + '", If you\'re running this in a browser, we recommend to disable style parsing: options.parseStyleAttributes: false, since this only works in a node environment due to a postcss dependency, More info: https://github.com/apostrophecms/sanitize-html/issues/547');
                  }
                  delete frame.attribs[a];
                  return;
                }
              } else if (options.allowedStyles) {
                throw new Error('allowedStyles option cannot be used together with parseStyleAttributes: false.');
              }
            }
            result += ' ' + a;
            if (value && value.length) {
              result += '="' + escapeHtml(value, true) + '"';
            } else if (options.allowedEmptyAttributes.includes(a)) {
              result += '=""';
            }
          } else {
            delete frame.attribs[a];
          }
        });
      }
      if (options.selfClosing.indexOf(name) !== -1) {
        result += ' />';
      } else {
        result += '>';
        if (frame.innerText && !hasText) {
          const escaped = escapeHtml(frame.innerText);
          if (options.textFilter) {
            result += options.textFilter(escaped, name);
          } else {
            result += escaped;
          }
          addedText = true;
        }
      }
      if (skip) {
        result = tempResult + escapeHtml(result);
        tempResult = '';
      }
      frame.openingTagLength = result.length - frame.tagPosition;
    },
    ontext: function(text) {
      if (skipText) {
        return;
      }
      const lastFrame = stack[stack.length - 1];
      let tag;

      if (lastFrame) {
        tag = lastFrame.tag;
        // If inner text was set by transform function then let's use it
        text = lastFrame.innerText !== undefined ? lastFrame.innerText : text;
      }

      if (options.disallowedTagsMode === 'completelyDiscard' && !tagAllowed(tag)) {
        text = '';
      } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === 'discard' || options.disallowedTagsMode === 'completelyDiscard') && ((tag === 'script') || (tag === 'style'))) {
        // htmlparser2 gives us these as-is. Escaping them ruins the content. Allowing
        // script tags is, by definition, game over for XSS protection, so if that's
        // your concern, don't allow them. The same is essentially true for style tags
        // which have their own collection of XSS vectors.
        result += text;
      } else if (tag && tagAllowed(tag) && (options.disallowedTagsMode === 'discard' || options.disallowedTagsMode === 'completelyDiscard') && (tag === 'textarea' || tag === 'xmp')) {
        // <textarea> and <xmp> hold text that must not be re-emitted verbatim:
        // if a raw `<` survives into the output it can reopen a tag when the
        // result is re-parsed by a browser, smuggling non-allowlisted markup
        // through the allowlist (mutation-XSS, GHSA-jxwj-j7wr-gfrw — e.g. the
        // `</textarea/>` solidus mis-close). We therefore ALWAYS escape this
        // content rather than passing it through. Escaping unconditionally also
        // closes the related SVG/MathML foreign-content bypass (where the HTML5
        // parser treats <textarea>/<xmp> as ordinary foreign elements and a
        // browser re-parses their contents as live markup, e.g.
        // `<svg><textarea><img src=x onerror=alert(1)></textarea></svg>`): since
        // we never re-emit raw text for these tags, no namespace check is
        // needed. The two tags need different escaping because htmlparser2
        // tokenizes them differently:
        if (tag === 'xmp') {
          // <xmp> is a raw-text (CDATA) element: entities are NOT decoded, so
          // its content reaches us as raw source that is already entity-encoded.
          // Escape only the angle brackets so a literal `<` cannot reopen a tag,
          // while leaving `&` untouched to avoid double-encoding entities that
          // are already encoded in the source.
          result += text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        } else {
          // <textarea> is an RCDATA element: htmlparser2 (>= 11) decodes
          // entities inside it, so its content reaches us as plain decoded text.
          // It must therefore be fully escaped like any other text — escaping
          // `&` as well as `<`/`>` — so entities round-trip faithfully (no
          // double-encoding, see the CVE-2026-40186 regression tests) and no
          // `<` can reopen a tag.
          result += escapeHtml(text, false);
        }
        // Other "nonTextTags" like <option> are not raw text elements in
        // htmlparser2, so their contents are decoded and must be escaped below
        // like any other text (important to prevent XSS via entity-encoded
        // payloads such as <option>&lt;script&gt;...&lt;/script&gt;</option>).
      } else if (!addedText) {
        const escaped = escapeHtml(text, false);
        if (options.textFilter) {
          result += options.textFilter(escaped, tag);
        } else {
          result += escaped;
        }
      }
      if (stack.length) {
        const frame = stack[stack.length - 1];
        frame.text += text;
      }
    },
    onclosetag: function(name, isImplied) {
      if (options.onCloseTag) {
        options.onCloseTag(name, isImplied);
      }

      if (skipText) {
        skipTextDepth--;
        if (!skipTextDepth) {
          skipText = false;
        } else {
          return;
        }
      }

      const frame = stack.pop();
      if (!frame) {
        // Do not crash on bad markup
        return;
      }

      if (frame.tag !== name) {
        // Another case of bad markup.
        // Push to stack, so that it will be used in future closing tags.
        stack.push(frame);
        return;
      }

      skipText = options.enforceHtmlBoundary ? name === 'html' : false;
      depth--;
      const skip = skipMap[depth];
      if (skip) {
        delete skipMap[depth];
        if (options.disallowedTagsMode === 'discard' || options.disallowedTagsMode === 'completelyDiscard') {
          frame.updateParentNodeText();
          return;
        }
        tempResult = result;
        result = '';
      }

      if (transformMap[depth]) {
        name = transformMap[depth];
        delete transformMap[depth];
      }

      if (options.exclusiveFilter) {
        const filterResult = options.exclusiveFilter(frame);
        if (filterResult === 'excludeTag') {
          if (skip) {
            // no longer escaping the tag since it's not added at all
            result = tempResult;
            tempResult = '';
          }
          // remove the opening tag from the result
          result = result.substring(0, frame.tagPosition) +
            result.substring(frame.tagPosition + frame.openingTagLength);
          return;
        } else if (filterResult) {
          result = result.substring(0, frame.tagPosition);
          return;
        }
      }

      frame.updateParentNodeMediaChildren();
      frame.updateParentNodeText();

      if (
        // Already output />
        options.selfClosing.indexOf(name) !== -1 ||
        // Escaped tag, closing tag is implied
        (isImplied && !tagAllowed(name) && [ 'escape', 'recursiveEscape' ].indexOf(options.disallowedTagsMode) >= 0)
      ) {
        if (skip) {
          result = tempResult;
          tempResult = '';
        }
        return;
      }

      result += '</' + name + '>';
      if (skip) {
        result = tempResult + escapeHtml(result);
        tempResult = '';
      }
      addedText = false;
    }
  }, options.parser);
  parser.write(html);
  parser.end();

  if (options.disallowedTagsMode === 'escape' || options.disallowedTagsMode === 'recursiveEscape') {
    const lastParsedIndex = parser.endIndex;
    if (lastParsedIndex != null && lastParsedIndex >= 0 &&
        lastParsedIndex < html.length) {
      const unparsed = html.substring(lastParsedIndex);
      result += escapeHtml(unparsed);
    } else if ((lastParsedIndex == null || lastParsedIndex < 0) && html.length > 0 && result === '') {
      result = escapeHtml(html);
    }
  }

  return result;

  function initializeState() {
    result = '';
    depth = 0;
    stack = [];
    skipMap = {};
    transformMap = {};
    skipText = false;
    skipTextDepth = 0;
  }

  function escapeHtml(s, quote) {
    if (typeof (s) !== 'string') {
      s = s + '';
    }
    if (options.parser.decodeEntities) {
      s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (quote) {
        s = s.replace(/"/g, '&quot;');
      }
    }
    // TODO: this is inadequate because it will pass `&0;`. This approach
    // will not work, each & must be considered with regard to whether it
    // is followed by a 100% syntactically valid entity or not, and escaped
    // if it is not. If this bothers you, don't set parser.decodeEntities
    // to false. (The default is true.)
    s = s.replace(/&(?![a-zA-Z0-9#]{1,20};)/g, '&amp;') // Match ampersands not part of existing HTML entity
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (quote) {
      s = s.replace(/"/g, '&quot;');
    }
    return s;
  }

  function naughtyHref(name, href) {
    // Resolve the per-tag scheme allowlist if one is configured for
    // this tag, otherwise fall back to the global allowedSchemes.
    const allowedSchemes = has(options.allowedSchemesByTag, name)
      ? options.allowedSchemesByTag[name]
      : (options.allowedSchemes || []);
    return launderNaughtyHref(href, {
      allowedSchemes,
      allowProtocolRelative: options.allowProtocolRelative
    });
  }

  function parseUrl(value) {
    value = value.replace(/^(\w+:)?\s*[\\/]\s*[\\/]/, '$1//');
    if (value.startsWith('relative:')) {
      // An attempt to exploit our workaround for base URLs being
      // mandatory for relative URL validation in the WHATWG
      // URL parser, reject it
      throw new Error('relative: exploit attempt');
    }
    // naughtyHref is in charge of whether protocol relative URLs
    // are cool. Here we are concerned just with allowed hostnames and
    // whether to allow relative URLs.
    //
    // Build a placeholder "base URL" against which any reasonable
    // relative URL may be parsed successfully
    let base = 'relative://relative-site';
    for (let i = 0; (i < 100); i++) {
      base += `/${i}`;
    }

    const parsed = new URL(value, base);

    const isRelativeUrl = parsed && parsed.hostname === 'relative-site' && parsed.protocol === 'relative:';
    return {
      isRelativeUrl,
      url: parsed
    };
  }
  /**
   * Filters user input css properties by allowlisted regex attributes.
   * Modifies the abstractSyntaxTree object.
   *
   * @param {object} abstractSyntaxTree  - Object representation of CSS attributes.
   * @property {array[Declaration]} abstractSyntaxTree.nodes[0] -
   * Each object contains prop and value key, i.e { prop: 'color', value: 'red' }.
   * @param {object} allowedStyles       - Keys are properties (i.e color),
   * value is list of permitted regex rules (i.e /green/i).
   * @return {object}                    - The modified tree.
   */
  function filterCss(abstractSyntaxTree, allowedStyles) {
    if (!allowedStyles) {
      return abstractSyntaxTree;
    }

    const astRules = abstractSyntaxTree.nodes[0];
    let selectedRule;

    // Merge global and tag-specific styles into new AST.
    if (allowedStyles[astRules.selector] && allowedStyles['*']) {
      selectedRule = deepmerge(
        allowedStyles[astRules.selector],
        allowedStyles['*']
      );
    } else {
      selectedRule = allowedStyles[astRules.selector] || allowedStyles['*'];
    }

    if (selectedRule) {
      abstractSyntaxTree.nodes[0].nodes = astRules.nodes
        .reduce(filterDeclarations(selectedRule), []);
    }

    return abstractSyntaxTree;
  }

  /**
   * Extracts the style attributes from an AbstractSyntaxTree and formats those
   * values in the inline style attribute format.
   *
   * @param  {AbstractSyntaxTree} filteredAST
   * @return {string}             - Example:
   * "color:yellow;text-align:center !important;font-family:helvetica;"
   */
  function stringifyStyleAttributes(filteredAST) {
    return filteredAST.nodes[0].nodes
      .reduce(function(extractedAttributes, attrObject) {
        extractedAttributes.push(
          `${attrObject.prop}:${attrObject.value}${attrObject.important ? ' !important' : ''}`
        );
        return extractedAttributes;
      }, [])
      .join(';');
  }

  /**
    * Filters the existing attributes for the given property. Discards any attributes
    * which don't match the allowlist.
    *
    * @param  {object} selectedRule - Example: { color: red, font-family: helvetica }
    * @param  {array} allowedDeclarationsList - List of declarations
    * which pass the allowlist.
    * @param  {object} attributeObject - Object representing the current css property.
    * @property {string} attributeObject.type - Typically 'declaration'.
    * @property {string} attributeObject.prop - The CSS property, i.e 'color'.
    * @property {string} attributeObject.value - The corresponding value to
    * the css property, i.e 'red'.
    * @return {function} - When used in Array.reduce,
    * will return an array of Declaration objects
    */
  function filterDeclarations(selectedRule) {
    return function (allowedDeclarationsList, attributeObject) {
      // If this property is allowlisted...
      if (has(selectedRule, attributeObject.prop)) {
        const matchesRegex = selectedRule[attributeObject.prop]
          .some(function(regularExpression) {
            return regularExpression.test(attributeObject.value);
          });

        if (matchesRegex) {
          allowedDeclarationsList.push(attributeObject);
        }
      }
      return allowedDeclarationsList;
    };
  }

  function filterClasses(classes, allowed, allowedGlobs) {
    if (!allowed) {
      // The class attribute is allowed without filtering on this tag
      return classes;
    }
    classes = classes.split(/\s+/);
    return classes.filter(function(clss) {
      return allowed.indexOf(clss) !== -1 || allowedGlobs.some(function(glob) {
        return glob.test(clss);
      });
    }).join(' ');
  }
}

// Defaults are accessible to you so that you can use them as a starting point
// programmatically if you wish

const htmlParserDefaults = {
  decodeEntities: true
};
sanitizeHtml.defaults = {
  allowedTags: [
    // Sections derived from MDN element categories and limited to the more
    // benign categories.
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
    // Content sectioning
    'address', 'article', 'aside', 'footer', 'header',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup',
    'main', 'nav', 'section',
    // Text content
    'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure',
    'hr', 'li', 'menu', 'ol', 'p', 'pre', 'ul',
    // Inline text semantics
    'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
    'em', 'i', 'kbd', 'mark', 'q',
    'rb', 'rp', 'rt', 'rtc', 'ruby',
    's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
    // Table content
    'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th',
    'thead', 'tr'
  ],
  // Tags that cannot be boolean
  nonBooleanAttributes: [
    'abbr', 'accept', 'accept-charset', 'accesskey', 'action',
    'allow', 'alt', 'as', 'autocapitalize', 'autocomplete',
    'blocking', 'charset', 'cite', 'class', 'color', 'cols',
    'colspan', 'content', 'contenteditable', 'coords', 'crossorigin',
    'data', 'datetime', 'decoding', 'dir', 'dirname', 'download',
    'draggable', 'enctype', 'enterkeyhint', 'fetchpriority', 'for',
    'form', 'formaction', 'formenctype', 'formmethod', 'formtarget',
    'headers', 'height', 'hidden', 'high', 'href', 'hreflang',
    'http-equiv', 'id', 'imagesizes', 'imagesrcset', 'inputmode',
    'integrity', 'is', 'itemid', 'itemprop', 'itemref', 'itemtype',
    'kind', 'label', 'lang', 'list', 'loading', 'low', 'max',
    'maxlength', 'media', 'method', 'min', 'minlength', 'name',
    'nonce', 'optimum', 'pattern', 'ping', 'placeholder', 'popover',
    'popovertarget', 'popovertargetaction', 'poster', 'preload',
    'referrerpolicy', 'rel', 'rows', 'rowspan', 'sandbox', 'scope',
    'shape', 'size', 'sizes', 'slot', 'span', 'spellcheck', 'src',
    'srcdoc', 'srclang', 'srcset', 'start', 'step', 'style',
    'tabindex', 'target', 'title', 'translate', 'type', 'usemap',
    'value', 'width', 'wrap',
    // Event handlers
    'onauxclick', 'onafterprint', 'onbeforematch', 'onbeforeprint',
    'onbeforeunload', 'onbeforetoggle', 'onblur', 'oncancel',
    'oncanplay', 'oncanplaythrough', 'onchange', 'onclick', 'onclose',
    'oncontextlost', 'oncontextmenu', 'oncontextrestored', 'oncopy',
    'oncuechange', 'oncut', 'ondblclick', 'ondrag', 'ondragend',
    'ondragenter', 'ondragleave', 'ondragover', 'ondragstart',
    'ondrop', 'ondurationchange', 'onemptied', 'onended',
    'onerror', 'onfocus', 'onformdata', 'onhashchange', 'oninput',
    'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup',
    'onlanguagechange', 'onload', 'onloadeddata', 'onloadedmetadata',
    'onloadstart', 'onmessage', 'onmessageerror', 'onmousedown',
    'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout',
    'onmouseover', 'onmouseup', 'onoffline', 'ononline', 'onpagehide',
    'onpageshow', 'onpaste', 'onpause', 'onplay', 'onplaying',
    'onpopstate', 'onprogress', 'onratechange', 'onreset', 'onresize',
    'onrejectionhandled', 'onscroll', 'onscrollend',
    'onsecuritypolicyviolation', 'onseeked', 'onseeking', 'onselect',
    'onslotchange', 'onstalled', 'onstorage', 'onsubmit', 'onsuspend',
    'ontimeupdate', 'ontoggle', 'onunhandledrejection', 'onunload',
    'onvolumechange', 'onwaiting', 'onwheel'
  ],
  disallowedTagsMode: 'discard',
  allowedAttributes: {
    a: [ 'href', 'name', 'target' ],
    // We don't currently allow img itself by default, but
    // these attributes would make sense if we did.
    img: [ 'src', 'srcset', 'alt', 'title', 'width', 'height', 'loading' ]
  },
  allowedEmptyAttributes: [
    'alt'
  ],
  // Lots of these won't come up by default because we don't allow them
  selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta', 'col' ],
  // URL schemes we permit
  allowedSchemes: [ 'http', 'https', 'ftp', 'mailto', 'tel' ],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: [
    'href', 'src', 'cite',
    'action', 'formaction', 'data', 'xlink:href',
    'poster', 'background', 'ping',
    'longdesc', 'usemap', 'codebase', 'classid', 'archive',
    'profile', 'manifest', 'itemid',
    'dynsrc', 'lowsrc'
  ],
  allowProtocolRelative: true,
  enforceHtmlBoundary: false,
  parseStyleAttributes: true,
  preserveEscapedAttributes: false
};

sanitizeHtml.simpleTransform = function(newTagName, newAttribs, merge) {
  merge = (merge === undefined) ? true : merge;
  newAttribs = newAttribs || {};

  return function(tagName, attribs) {
    let attrib;
    if (merge) {
      for (attrib in newAttribs) {
        attribs[attrib] = newAttribs[attrib];
      }
    } else {
      attribs = newAttribs;
    }

    return {
      tagName: newTagName,
      attribs
    };
  };
};
