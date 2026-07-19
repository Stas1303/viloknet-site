import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Regression: ISSUE-002 — empty cart displayed an active checkout action
// Found by /qa on 2026-07-19
// Report: .gstack/qa-reports/qa-report-viloknet-ru-2026-07-19.md
test('empty cart disables checkout and populated cart enables it', () => {
  assert.match(html, /id="cart-order-btn"[^>]*disabled/);
  assert.match(html, /getElementById\('cart-order-btn'\)\.disabled\s*=\s*cartItems\.length\s*===\s*0/);
  assert.match(html, /\.cart-order-btn:disabled\s*\{/);
});
