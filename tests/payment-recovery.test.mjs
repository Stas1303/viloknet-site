import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('async function resumeOnlinePayment()');
const source = html.slice(start, html.indexOf('// Phone mask', start));

test('a saved paid checkout is retried on the next site visit', () => {
  assert.match(source, /if \(!returnedFromPayment && !pending\) return/);
  assert.match(source, /payment\?action=status&paymentId=/);
  assert.match(source, /payment\?action=order-create|\/api\/order-create/);
  assert.match(source, /localStorage\.removeItem\('viloknet_pending_payment'\)/);
});

test('a transient recovery error keeps the pending payment for another retry', () => {
  const removeIndex = source.indexOf("localStorage.removeItem('viloknet_pending_payment')");
  const catchIndex = source.indexOf('} catch (error)');
  assert.ok(removeIndex > 0 && removeIndex < catchIndex);
  assert.doesNotMatch(source.slice(catchIndex), /removeItem\('viloknet_pending_payment'\)/);
});
