// Inlined from `launder` (https://github.com/apostrophecms/apostrophe/tree/main/packages/launder)
// to avoid pulling in a CommonJS dependency (and its own CJS `dayjs` dependency),
// which defeats ESM-only bundling. Kept in sync manually; it is a small, stable function.
//
// Strip characters browsers ignore inside URLs (control chars and
// embedded HTML comments) that are commonly used to sneak XSS
// payloads past simple scheme checks.
function cleanHref(href) {
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

const DEFAULT_ALLOWED_SCHEMES = [ 'http', 'https', 'ftp', 'mailto', 'tel', 'sms' ];

// Returns true if `href` should be rejected as unsafe.
export function naughtyHref(href, options) {
  options = options || {};
  const allowedSchemes = options.allowedSchemes || DEFAULT_ALLOWED_SCHEMES;
  const allowProtocolRelative = (options.allowProtocolRelative !== false);
  if (typeof href !== 'string') {
    return false;
  }
  href = cleanHref(href);
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
