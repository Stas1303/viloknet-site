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

test('keeps flash-call hidden while exposing the separate loyalty signup', () => {
  assert.match(html, /const FLASH_CALL_ENABLED = false;/);
  assert.match(html, /FLASH_CALL_ENABLED \? 'Вход по телефону' : 'Мои данные'/);
  assert.match(html, /!FLASH_CALL_ENABLED \? 'Сохранить и вступить'/);
  assert.match(html, /данные сохранены в базе и добавлены в выгрузку для Saby/);
  assert.match(html, /document\.getElementById\('auth-consent-wrap'\)\.style\.display = _authUser \? 'none' : 'flex'/);
  assert.doesNotMatch(html, /\.flash-call-off \.loyalty-cta/);
  assert.match(html, /id="loyalty-register-overlay"/);
  assert.match(html, /action=loyalty-register/);
});

test('mobile header exposes a burger menu and a return-to-top action', () => {
  assert.match(html, /id="mobile-menu-btn"/);
  assert.match(html, /id="mobile-menu-panel"/);
  assert.match(html, />Наверх</);
  assert.match(html, /function toggleMobileMenu\(\)/);
  assert.match(html, /window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\)/);
});

test('delivery error stays in the form instead of opening a Safari alert', () => {
  const quoteStart = html.indexOf('async function requestDeliveryQuote');
  const quoteEnd = html.indexOf('// «Сейчас»', quoteStart);
  const quoteSource = html.slice(quoteStart, quoteEnd);
  assert.match(quoteSource, /addressEl\.classList\.add\('err'\)/);
  assert.match(quoteSource, /addressEl\.scrollIntoView/);
  assert.doesNotMatch(quoteSource, /alert\(/);
  assert.match(html, /Красногорск, улица, дом/);
});
