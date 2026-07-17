import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('resynchronizes the profile header when Safari restores the page', () => {
  assert.match(html, /window\.addEventListener\('pageshow', initAuth\)/);
});

test('initializes delivery state before restoring a saved cart', () => {
  const zoneState = html.indexOf('let _selectedZone = null;');
  const initialCartRestore = html.indexOf('// Restore cart on page load');
  assert.ok(zoneState >= 0, 'delivery state declaration is missing');
  assert.ok(initialCartRestore >= 0, 'initial cart restore is missing');
  assert.ok(zoneState < initialCartRestore, 'saved cart can abort profile initialization');
});

test('does not present protected history as a profile login failure', () => {
  assert.match(html, /block\.style\.display = "none";/);
  assert.doesNotMatch(html, /Не удалось загрузить историю/);
});
