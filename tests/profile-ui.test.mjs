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
  assert.match(html, /\(_authUser \|\| localMember\) \? 'Мой профиль'/);
  assert.match(html, /\(_authUser \|\| localMember\) \? 'Сохранить'/);
  assert.match(html, /данные сохранены в базе и добавлены в выгрузку для Saby/);
  assert.match(html, /auth-consent-wrap'\)\.style\.display = \(_authUser \|\| localMember\) \? 'none' : 'flex'/);
  assert.doesNotMatch(html, /\.flash-call-off \.loyalty-cta/);
  assert.match(html, /id="loyalty-register-overlay"/);
  assert.match(html, /action=loyalty-register/);
});

test('a saved member opens the profile without repeating registration', () => {
  assert.match(html, /function hasLocalMember\(\)/);
  assert.match(html, /if \(_authUser \|\| hasLocalMember\(\)\) \{\s*openAuthModal\(\)/);
  assert.match(html, /if \(!_authUser && hasLocalMember\(\)\) \{/);
  assert.match(html, /Профиль сохранён на этом устройстве/);
  assert.match(html, /window\.renderOrderHistory\(data\)/);
  assert.match(html, /window\.renderFavorites\(data\.favorites\)/);
});

test('profile is restored from the server on the same browser without asking for a code', () => {
  assert.match(html, /async function refreshDeviceProfile/);
  assert.match(html, /authenticated \|\| refreshDeviceProfile\(false\)/);
  assert.match(html, /headers\['X-Profile-Key'\] = getOrCreateLocalProfileKey\(\)/);
  assert.match(html, /method: 'PATCH', body: JSON\.stringify\(\{ name, address \}\)/);
  assert.match(html, /window\.syncLocalFavoritesToDevice/);
  assert.match(html, /method: exists \? 'DELETE' : 'POST'/);
  assert.doesNotMatch(html, /order-code-verify/);
  assert.doesNotMatch(html, /Код из выполненного заказа/);
});

test('local profile keeps favorites and order history until secure phone verification is available', () => {
  assert.match(html, /const LOCAL_FAVORITES_KEY = 'viloknet_favorites'/);
  assert.match(html, /const LOCAL_ORDERS_KEY = 'viloknet_orders'/);
  assert.match(html, /const LOCAL_PROFILE_KEY = 'viloknet_profile_key'/);
  assert.match(html, /'X-Profile-Key': getOrCreateLocalProfileKey\(\)/);
  assert.match(html, /\/api\/account\?action=device-profile/);
  assert.match(html, /localStorage\.setItem\(LOCAL_FAVORITES_KEY/);
  assert.match(html, /rememberLocalOrder\(result\.order, localOrderDraft\)/);
  assert.match(html, /rememberLocalOrder\(result\.order, pending\.orderDraft\)/);
  assert.match(html, /syncLocalFavoritesToAccount/);
});

test('mobile header exposes a burger menu and a return-to-top action', () => {
  assert.match(html, /id="mobile-menu-btn"/);
  assert.match(html, /id="mobile-menu-panel"/);
  assert.match(html, /class="mobile-menu-grid"/);
  assert.match(html, /class="mobile-menu-tile" href="#menu"/);
  assert.match(html, /class="mobile-menu-tile" href="#delivery"/);
  assert.match(html, /class="mobile-menu-tile" href="#loyalty"/);
  assert.match(html, /class="mobile-menu-tile" href="#about"/);
  assert.match(html, />\s*На главную\s*</);
  assert.match(html, /function toggleMobileMenu\(\)/);
  assert.match(html, /window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\)/);
  assert.match(html, /header \{ position: fixed; top: 0; left: 0; right: 0; z-index: 500/);
  assert.match(html, /\.mobile-menu-btn \{ display: flex; background: var\(--red\)/);
  assert.match(html, /document\.getElementById\('modal-overlay'\)\?\.classList\.contains\('show'\)/);
  const panel = html.slice(html.indexOf('<div class="mobile-menu-panel"'), html.indexOf('<!-- HERO -->'));
  assert.doesNotMatch(panel, /aria-hidden="true">[→↑]/);
});

test('reuses a delivery quote only for the same address and cart', () => {
  assert.match(html, /const quoteKey = address \+ '\\|' \+ JSON\.stringify\(sb\.items\)/);
  assert.match(html, /_deliveryQuoteAddress === quoteKey/);
  assert.match(html, /_deliveryQuoteAddress = quoteKey/);
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
