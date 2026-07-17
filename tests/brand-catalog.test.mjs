import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const showcase = await readFile(new URL('../vitrina.html', import.meta.url), 'utf8');

test('brand typography does not use the forbidden bold italic face', () => {
  assert.doesNotMatch(index, /BlackItalic/);
  assert.doesNotMatch(index, /font-style\s*:\s*italic/i);
  assert.doesNotMatch(showcase, /font-style\s*:\s*italic/i);
  assert.doesNotMatch(index, /Playfair Display/i);
});

test('the supplied Ropa wordmark and fork are used consistently', () => {
  assert.match(index, /brand\/viloknet-logo\.jpeg/);
  assert.match(index, /rel="icon"[^>]+brand\/viloknet-logo\.jpeg\?v=/);
  assert.match(index, /rel="apple-touch-icon"[^>]+brand\/viloknet-logo\.jpeg\?v=/);
  assert.doesNotMatch(index, /class="(?:logo-fork|flogo-fork|logo-text|flogo-text)"/);
  assert.match(showcase, /brand\/viloknet-logo\.jpeg/);
});

test('loyalty mentions expose a direct registration route', () => {
  const routes = index.match(/\?register=loyalty#loyalty/g) || [];
  assert.ok(routes.length >= 3, 'expected registration links in benefits and loyalty card');
  assert.match(index, /openLoyaltyRegistration/);
  assert.match(index, /action=loyalty-register/);
  assert.match(index, /Присоединиться бесплатно/);
  assert.doesNotMatch(index, /flash-call-off \.loyalty-cta/);
});

test('catalog selects one complete product context and hides zero prices', () => {
  assert.match(index, /function dedupeCatalogProducts\(products\)/);
  assert.match(index, /const products = dedupeCatalogProducts\(d\.products\)/);
  assert.match(index, /Number\(p\.price\) > 0 \? `<div class="p-price">/);
});

test('order mapping keeps the complete Saby catalog and can refresh stale carts', () => {
  assert.match(index, /d\.products\.forEach\(\(p\) => \{ P\[p\.id\] = p; \}\)/);
  assert.match(index, /window\.refreshSbisCatalogForOrder = async function/);
  assert.match(index, /unmapped\.push\(ci\.baseName \|\| ci\.name\)/);
});
