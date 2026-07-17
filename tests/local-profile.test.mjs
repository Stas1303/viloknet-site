import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/function getLocalProfile\(\) \{[\s\S]*?\n  function rememberLocalOrder\(order, draft\) \{[\s\S]*?\n  \}/);
assert.ok(match, 'local profile helpers must remain extractable');

function createContext(initial = {}) {
  const values = new Map(Object.entries(initial));
  const context = {
    Date,
    JSON,
    Object,
    Number,
    String,
    Array,
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
    formatPhone: (raw) => String(raw || '').replace(/\D/g, ''),
    LOCAL_FAVORITES_KEY: 'viloknet_favorites',
    LOCAL_ORDERS_KEY: 'viloknet_orders',
  };
  vm.runInNewContext(`${match[0]}; this.api = { getLocalProfile, hasLocalMember, getLocalFavorites, getLocalOrders, localProfileData, rememberLocalOrder };`, context);
  return { ...context, values };
}

test('recognizes a previously saved loyalty member without asking to register again', () => {
  const { api } = createContext({
    viloknet_user: JSON.stringify({ name: 'Стас', phone: '+7 (963) 926-81-57' }),
  });
  assert.equal(api.hasLocalMember(), true);
});

test('stores a successful order with its dishes and exposes profile totals', () => {
  const { api } = createContext({
    viloknet_user: JSON.stringify({ name: 'Стас', phone: '+7 (963) 926-81-57' }),
  });
  api.rememberLocalOrder(
    { id: 'sale-1', placedAt: 1_721_200_000_000, status: 'accepted', statusLabel: 'Заказ принят' },
    { total: 465, items: [{ id: '10', name: 'Круассан', price: 145, qty: 1 }, { id: '20', name: 'Шаурма', price: 320, qty: 1 }] },
  );
  const profile = api.localProfileData();
  assert.equal(profile.totalOrders, 1);
  assert.equal(profile.totalSpent, 465);
  assert.equal(profile.orders[0].items[1].name, 'Шаурма');
  assert.equal(profile.topDish, 'Круассан');
});

test('does not attach local history to an incomplete profile', () => {
  const { api } = createContext({ viloknet_user: JSON.stringify({ name: 'Стас' }) });
  api.rememberLocalOrder({ id: 'sale-2' }, { total: 100, items: [] });
  assert.equal(api.getLocalOrders().length, 0);
});
