import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Regression: ISSUE-001 — fixed mobile header covered the only cart close control
// Found by /qa on 2026-07-19
// Report: .gstack/qa-reports/qa-report-viloknet-ru-2026-07-19.md
test('mobile cart keeps a visible close control and the header button toggles it', () => {
  assert.match(html, /\.cart-drawer\s*\{\s*top:\s*60px;[^}]*height:\s*calc\(100dvh\s*-\s*60px\)/s);
  assert.match(html, /aria-label="Закрыть корзину"/);
  assert.match(html, /if \(overlay\.classList\.contains\('show'\)\) \{\s*closeCart\(\);\s*return;/s);
  assert.match(html, /aria-controls="cart-drawer"[^>]*onclick="openCart\(\)"/);
});
