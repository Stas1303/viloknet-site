import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Regression: ISSUE-005 — icon-only mobile header buttons lost their accessible names
// Found by /qa on 2026-07-19
// Report: .gstack/qa-reports/qa-report-viloknet-ru-2026-07-19.md
test('icon-only header and modal controls expose stable accessible names', () => {
  assert.match(html, /class="cart-btn cart-btn-red"[^>]*aria-label="Открыть корзину"/);
  assert.match(html, /id="auth-btn"[^>]*aria-label="Открыть профиль"/);
  assert.match(html, /id="bonus-pill"[^>]*aria-label="Открыть бонусы и профиль"/);
  assert.match(html, /aria-label="Закрыть оформление заказа"/);
  assert.match(html, /aria-label="Закрыть профиль"/);
  assert.match(html, /aria-label="Закрыть регистрацию"/);
});
