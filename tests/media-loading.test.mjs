import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('does not attach all video sources while building the menu', () => {
  assert.match(html, /v\.dataset\.src=live\.src/);
  assert.match(html, /v\.preload="none"/);
  assert.doesNotMatch(html, /v\.className="live-vid"; v\.src=live\.src/);
  assert.match(html, /if\(v && !v\.getAttribute\("src"\) && v\.dataset\.src\)/);
});

test('retries failed catalog images once and then shows a branded fallback', () => {
  assert.match(html, /window\.retryMenuImage = function/);
  assert.match(html, /onerror="retryMenuImage\(this\)"/);
  assert.match(html, /parentElement\.classList\.add\('image-fallback'\)/);
});

test('loads only nearby top-feed photos', () => {
  assert.match(html, /img\[data-src\]/);
  assert.match(html, /if \(a <= 2\)/);
});
