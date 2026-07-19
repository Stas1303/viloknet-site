import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('site publishes the current delivery and pickup hours', () => {
  assert.match(html, /Доставка: 10:00–21:30/);
  assert.match(html, /самовывоз: 10:00–22:00/);
  assert.match(html, /DELIVERY_CLOSE_MINUTES = 21 \* 60 \+ 30/);
  assert.match(html, /PICKUP_CLOSE_MINUTES = 22 \* 60/);
});

test('checkout checks availability both when opening and before submit', () => {
  assert.match(html, /function openOrderModal\(\)[\s\S]*getOrderAvailability\(false\)/);
  assert.match(html, /async function submitOrder\(\)[\s\S]*const availability = getOrderAvailability\(isPickup\)/);
});
