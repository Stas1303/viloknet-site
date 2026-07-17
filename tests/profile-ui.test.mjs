import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('resynchronizes the profile header when Safari restores the page', () => {
  assert.match(html, /window\.addEventListener\('pageshow', initAuth\)/);
});

test('does not require a manual delivery-zone selector', () => {
  assert.doesNotMatch(html, /onclick="selectZone\(/);
  assert.doesNotMatch(html, /id="o-zone-options"/);
  assert.match(html, /Посмотреть границы зон на карте/);
});

test('does not present protected history as a profile login failure', () => {
  assert.match(html, /block\.style\.display = "none";/);
  assert.doesNotMatch(html, /Не удалось загрузить историю/);
});

test('temporarily saves profile data without exposing the inactive flash-call', () => {
  assert.match(html, /const FLASH_CALL_ENABLED = false;/);
  assert.match(html, /FLASH_CALL_ENABLED \? 'Вход по телефону' : 'Мои данные'/);
  assert.match(html, /localStorage\.setItem\('viloknet_user', JSON\.stringify\(\{ name, phone, address \}\)\)/);
  assert.match(html, /\(_authUser \|\| !FLASH_CALL_ENABLED\) \? 'Сохранить'/);
  assert.match(html, /\.flash-call-off \.loyalty-cta \{ display:none !important; \}/);
});
