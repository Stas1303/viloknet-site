import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../admin-loyalty.html', import.meta.url), 'utf8');

test('admin registry can show orders for presets, all time and a custom date range', () => {
  for (const value of ['today', '7d', '30d', 'all', 'custom']) {
    assert.match(html, new RegExp(`<option value="${value}"`));
  }
  assert.match(html, /id="orderFrom" type="date"/);
  assert.match(html, /id="orderTo" type="date"/);
  assert.match(html, /new URLSearchParams\(\{format:'summary',period\}\)/);
  assert.match(html, /id="ordersBody"/);
  assert.match(html, /data\.ordersTruncated/);
  assert.doesNotMatch(html, /localStorage|sessionStorage/);
});
