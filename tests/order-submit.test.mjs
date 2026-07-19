import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/async function submitOrder\(\) \{[\s\S]*?\n  \}\n\n  \/\/ Phone mask/);
assert.ok(match, 'submitOrder must remain extractable for the regression test');
const submitOrderSource = match[0].replace(/\n\n  \/\/ Phone mask[\s\S]*$/, '');

function element(value = '') {
  const classes = new Set();
  return {
    value,
    checked: false,
    disabled: false,
    textContent: '',
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => force ? classes.add(name) : classes.delete(name),
    },
  };
}

function createScenario({ name = 'Иван', orderResponse, mappingReady = true, refreshedMapping, paymentType = 'cash', orderAllowed = true } = {}) {
  const elements = {
    'o-name': element(name),
    'o-phone': element('+7 (999) 123-45-67'),
    'o-address': element('Красногорск, Подмосковный б-р, 14'),
    'o-apartment': element('42'),
    'o-entrance': element('1'),
    'o-floor': element('2'),
    'o-comment': element('Без лука'),
    'o-pay': element(paymentType),
    'o-change': element('2000'),
    'o-time-input': element(''),
    'o-asap': element(),
    'o-consent-pd': element(),
    'order-consent': element(),
    'modal-form-body': element(),
    'modal-foot': element(),
    'modal-success': element(),
  };
  elements['o-asap'].checked = true;
  elements['o-consent-pd'].checked = true;
  const button = element();
  button.textContent = 'Подтвердить заказ';
  const alerts = [];
  const fetchCalls = [];
  let authInitCalls = 0;
  let refreshMappingCalls = 0;
  const rememberedOrders = [];
  let assignedLocation = null;
  const context = {
    console: { error() {} },
    document: {
      getElementById: (id) => elements[id],
      querySelector: (selector) => selector === '.modal-submit' ? button : null,
    },
    window: {
      SBIS_API: 'https://backend.test',
      crypto: { randomUUID: () => '12345678-1234-4234-8234-123456789012' },
      location: { assign: (url) => { assignedLocation = url; } },
      buildSbisItems: () => mappingReady
        ? { ready: true, items: [{ id: 123, count: 1, cost: 320, name: 'Шаурма' }] }
        : { ready: false, items: [], unmapped: ['Шаурма'] },
      ...(refreshedMapping === undefined ? {} : {
        refreshSbisCatalogForOrder: async () => {
          refreshMappingCalls += 1;
          return refreshedMapping
            ? { ready: true, items: [{ id: 123, count: 1, cost: 320, name: 'Шаурма' }], unmapped: [] }
            : { ready: false, items: [], unmapped: ['Шаурма'] };
        },
      }),
    },
    localStorage: { setItem() {} },
    alert: (message) => alerts.push(message),
    setTimeout() {},
    closeModal() {},
    renderCart() {},
    initAuth: () => { authInitCalls += 1; },
    rememberLocalOrder: (order, draft) => { rememberedOrders.push({ order, draft }); },
    formatPhone: (raw) => raw.replace(/\D/g, ''),
    getZone: () => 2,
    deliveryCost: () => 150,
    getOrderAvailability: () => ({ allowed: orderAllowed, openMinutes: 600, closeMinutes: 1290 }),
    createOrderIdempotencyKey: () => '12345678-1234-4234-8234-123456789012',
    requestDeliveryQuote: async () => true,
    fetch: async (url, options) => {
      fetchCalls.push({ url, options });
      return orderResponse || { ok: true, json: async () => ({ ok: true }) };
    },
  };

  vm.runInNewContext(`
    var cartItems = [{ id: '123', name: 'Шаурма', price: 320, qty: 1 }];
    var _orderType = 'delivery';
    var _orderIdempotencyKey = null;
    var OPEN_HOUR = 10, CLOSE_HOUR = 22, PREP_MIN = 30;
    var pad2 = (n) => String(n).padStart(2, '0');
    var mskNow = () => new Date('2026-07-17T09:00:00Z');
    var parseTimeInput = () => null;
    ${submitOrderSource}
  `, context);

  return {
    context, elements, button, alerts, fetchCalls,
    get authInitCalls() { return authInitCalls; },
    get refreshMappingCalls() { return refreshMappingCalls; },
    get assignedLocation() { return assignedLocation; },
    rememberedOrders,
  };
}

test('reaches order-create without the removed deliveryTime variable', async () => {
  const scenario = createScenario();
  await scenario.context.submitOrder();

  assert.equal(scenario.fetchCalls[0].url, 'https://backend.test/api/order-create');
  const createBody = JSON.parse(scenario.fetchCalls[0].options.body);
  assert.equal(createBody.addressFull, 'Красногорск, Подмосковный б-р, 14, квартира 42, подъезд 1, этаж 2');
  assert.equal(createBody.zone, null);
  assert.equal(scenario.fetchCalls[0].options.headers['Idempotency-Key'], '12345678-1234-4234-8234-123456789012');
  assert.equal(scenario.fetchCalls.length, 1);
  assert.equal(scenario.context.cartItems.length, 0);
  assert.equal(scenario.authInitCalls, 1);
  assert.equal(scenario.elements['modal-success'].classList.contains('show'), true);
  assert.equal(scenario.rememberedOrders.length, 1);
  assert.equal(scenario.rememberedOrders[0].draft.items[0].name, 'Шаурма');
  assert.equal(scenario.rememberedOrders[0].draft.total, 320);
  assert.deepEqual(scenario.alerts, []);
});

test('keeps the cart and restores the button when Saby rejects the order', async () => {
  const scenario = createScenario({
    orderResponse: { ok: false, json: async () => ({ error: 'СБИС отклонил заказ' }) },
  });
  await scenario.context.submitOrder();

  assert.equal(scenario.context.cartItems.length, 1);
  assert.equal(scenario.button.disabled, false);
  assert.equal(scenario.button.textContent, 'Подтвердить заказ');
  assert.match(scenario.alerts[0], /Корзина сохранена/);
  assert.equal(scenario.fetchCalls.some(({ url }) => url.endsWith('/api/order-save')), false);
});

test('refreshes a stale catalog and continues the order automatically', async () => {
  const scenario = createScenario({ mappingReady: false, refreshedMapping: true });
  await scenario.context.submitOrder();

  assert.equal(scenario.refreshMappingCalls, 1);
  assert.equal(scenario.fetchCalls.length, 1);
  assert.equal(scenario.fetchCalls[0].url, 'https://backend.test/api/order-create');
  assert.equal(scenario.context.cartItems.length, 0);
  assert.deepEqual(scenario.alerts, []);
});

test('online payment cannot be started while YooKassa is disabled', async () => {
  const scenario = createScenario({
    mappingReady: false,
    refreshedMapping: true,
    paymentType: 'online',
  });
  await scenario.context.submitOrder();

  assert.equal(scenario.refreshMappingCalls, 0);
  assert.equal(scenario.fetchCalls.length, 0);
  assert.equal(scenario.assignedLocation, null);
  assert.match(scenario.alerts[0], /временно отключена/i);
});

test('does not fake success when an item is absent from the refreshed catalog', async () => {
  const scenario = createScenario({ mappingReady: false });
  await scenario.context.submitOrder();

  assert.equal(scenario.fetchCalls.length, 0);
  assert.equal(scenario.context.cartItems.length, 1);
  assert.match(scenario.alerts[0], /Не удалось найти некоторые блюда/);
  assert.match(scenario.alerts[0], /Шаурма/);
});

test('requires the customer name expected by the backend', async () => {
  const scenario = createScenario({ name: '' });
  await scenario.context.submitOrder();

  assert.equal(scenario.fetchCalls.length, 0);
  assert.equal(scenario.elements['o-name'].classList.contains('err'), true);
});

test('sends delivery without asking the customer to choose a zone', async () => {
  const scenario = createScenario();
  await scenario.context.submitOrder();

  assert.equal(scenario.fetchCalls.length, 1);
  const createBody = JSON.parse(scenario.fetchCalls[0].options.body);
  assert.equal(createBody.zone, null);
});

test('does not send an order while the venue is closed', async () => {
  const scenario = createScenario({ orderAllowed: false });
  await scenario.context.submitOrder();

  assert.equal(scenario.fetchCalls.length, 0);
  assert.equal(scenario.context.cartItems.length, 1);
  assert.match(scenario.alerts[0], /доставка недоступна/i);
});
