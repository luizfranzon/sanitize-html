// Runs sanitizeHtml against large documents that mix benign markup with
// XSS attack vectors, and prints timing stats per scenario. Useful as a
// baseline before/after a performance-sensitive change: run it, apply the
// change, run it again, and compare.
//
// Usage: npm run benchmark

import sanitizeHtml from '../index.js';
import { documents } from './payloads.mjs';

function median(values) {
  const sorted = [ ...values ].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function bench(name, html, options, iterations, warmup) {
  let output;
  for (let i = 0; i < warmup; i++) {
    output = sanitizeHtml(html, options);
  }
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = process.hrtime.bigint();
    output = sanitizeHtml(html, options);
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    name,
    inputKB: +(html.length / 1024).toFixed(1),
    outputKB: +(output.length / 1024).toFixed(1),
    iterations,
    meanMs: +mean.toFixed(3),
    medianMs: +median(samples).toFixed(3),
    minMs: +Math.min(...samples).toFixed(3),
    maxMs: +Math.max(...samples).toFixed(3),
    outputHash: hashCode(output)
  };
}

const scenarios = [
  {
    name: 'mixedMedium-defaultOptions',
    html: documents.mixedMedium,
    options: undefined,
    iterations: 60,
    warmup: 10
  },
  {
    name: 'mixedLarge-defaultOptions',
    html: documents.mixedLarge,
    options: undefined,
    iterations: 20,
    warmup: 5
  },
  {
    name: 'allXss-restrictiveAllowlist',
    html: documents.allXss,
    options: {
      allowedTags: [ 'p', 'b', 'i', 'a' ],
      allowedAttributes: { a: [ 'href' ] }
    },
    iterations: 30,
    warmup: 5
  },
  {
    name: 'deepNesting-defaultOptions',
    html: documents.deepNesting,
    options: undefined,
    iterations: 30,
    warmup: 5
  }
];

const results = scenarios.map(
  s => bench(s.name, s.html, s.options, s.iterations, s.warmup)
);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(
    'scenario'.padEnd(30),
    'inputKB'.padStart(9),
    'medianMs'.padStart(10),
    'meanMs'.padStart(10),
    'minMs'.padStart(9),
    'maxMs'.padStart(9)
  );
  for (const r of results) {
    console.log(
      r.name.padEnd(30),
      String(r.inputKB).padStart(9),
      String(r.medianMs).padStart(10),
      String(r.meanMs).padStart(10),
      String(r.minMs).padStart(9),
      String(r.maxMs).padStart(9)
    );
  }
}
