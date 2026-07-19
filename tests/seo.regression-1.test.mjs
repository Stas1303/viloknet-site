import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const [html, robots, sitemap] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('robots.txt', root), 'utf8'),
  readFile(new URL('sitemap.xml', root), 'utf8'),
]);

// Regression: ISSUE-007 — the public site had no search/social metadata or crawler map
// Found by /qa on 2026-07-19
// Report: .gstack/qa-reports/qa-report-viloknet-ru-2026-07-19.md
test('public homepage publishes one canonical SEO identity and crawler map', () => {
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/viloknet\.ru\/"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/viloknet\.ru\/brand\/viloknet-logo\.jpeg"/);
  assert.match(robots, /Sitemap: https:\/\/viloknet\.ru\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/viloknet\.ru\/<\/loc>/);
});
