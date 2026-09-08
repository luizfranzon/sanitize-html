// Tags that can conceivably represent stand-alone media.
export const mediaTags = [
  'img', 'audio', 'video', 'picture', 'svg',
  'object', 'map', 'iframe', 'embed'
];

// Tags that are inherently vulnerable to being used in XSS attacks.
export const vulnerableTags = [ 'script', 'style' ];

// SVG SMIL animation elements that can copy their `values`/`to`/`by`/`from`
// attribute into a target attribute named by `attributeName` *after*
// sanitization has run. If that target is a URL-bearing attribute (e.g.
// `href`), a `javascript:` destination in the animation values reaches a
// live sink without ever passing through scheme checking.
export const svgAnimationTags = [
  'animate', 'animatecolor', 'animatemotion', 'animatetransform', 'set'
];

// Attributes that are always treated as URL-bearing targets for the
// SMIL animation check above, regardless of allowedSchemesAppliedToAttributes.
export const alwaysUrlAttributes = [ 'href' ];

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
export const VALID_HTML_ATTRIBUTE_NAME = /^[^\0\t\n\f\r /<=>]+$/;

export const htmlParserDefaults = {
  decodeEntities: true
};
