import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../admin-analytics.html', import.meta.url), 'utf8');
const loyalty = readFileSync(new URL('../admin-loyalty.html', import.meta.url), 'utf8');

test('tracks the 3D feed and regular catalog with anonymous sessions', () => {
  assert.match(html, /viloknet_analytics_session/);
  assert.match(html, /crypto\?\.randomUUID/);
  assert.match(html, /data-analytics-source="regular"/);
  assert.match(html, /dataset\.analyticsSource = "three_d"/);
  assert.match(html, /openMods\('\$\{esc\(p\.id\)\}','regular'\)/);
  assert.match(html, /openMods\(String\(p\.id\), 'three_d'\)/);
});

test('tracks the complete menu conversion funnel', () => {
  for (const event of ['view', 'item_click', 'add_to_cart', 'checkout_start', 'order_success']) {
    assert.match(html, new RegExp(event));
  }
  assert.match(html, /menuAnalytics\?\.conversion\('order_success'\)/);
  assert.match(html, /menuAnalytics\?\.clearAttribution\(\)/);
});

test('analytics payload contains no customer personal data', () => {
  const start = html.indexOf('window.menuAnalytics =');
  const block = html.slice(start, html.indexOf('/* ── MENU TABS', start));
  assert.match(block, /'Content-Type': 'application\/json'/);
  assert.match(block, /JSON\.stringify\(\{ event, source, sessionId \}\)/);
  assert.doesNotMatch(block, /phone|address|email|name/i);
});

test('private admin pages do not persist the administrator key', () => {
  assert.match(admin, /noindex,nofollow/);
  assert.match(admin, /X-Admin-Token/);
  assert.match(admin, /Все клики/);
  assert.match(admin, /metrics\.item_click\.events/);
  assert.doesNotMatch(admin, /localStorage|sessionStorage/);
  assert.match(loyalty, /format=summary/);
  assert.match(loyalty, /Скачать актуальный Excel/);
  assert.doesNotMatch(loyalty, /localStorage|sessionStorage/);
});
