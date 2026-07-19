import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Regression: ISSUE-003 — failed delivery quote left the order summary loading forever
// Found by /qa on 2026-07-19
// Report: .gstack/qa-reports/qa-report-viloknet-ru-2026-07-19.md
test('delivery quote failure replaces the pending summary with an honest unavailable state', () => {
  assert.match(html, /let _deliveryQuoteError = ''/);
  assert.match(html, /_deliveryQuoteError\s*=\s*error\.message\s*\|\|\s*'Уточните адрес доставки'/);
  assert.match(html, /_deliveryQuoteError \? '\(не рассчитано\)' : '\(по адресу\)'/);
  assert.match(html, /_deliveryQuoteError \? '—' : 'Рассчитываем…'/);
});
