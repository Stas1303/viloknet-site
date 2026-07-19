import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Regression: the catalog API now returns absolute Saby preview URLs. Prefixing
// them with SBIS_API hid every regular catalog image after the image audit.
test('all catalog surfaces accept absolute previews and relative proxy images', () => {
  assert.match(html, /function menuImageUrl\(value\)/);
  assert.match(html, /if \(\/\^https:\\\/\\\/\/i\.test\(raw\)\) return raw/);
  assert.match(html, /if \(raw\.startsWith\("\/"\)\) return SBIS_API \+ raw/);

  assert.doesNotMatch(html, /SBIS_API \+ p\.image/);
  assert.doesNotMatch(html, /SBIS_API \+ product\.image/);
  assert.doesNotMatch(html, /SBIS_API \+ CUR\.image/);
  assert.doesNotMatch(html, /SBIS_API \+ withImg\.image/);

  const uses = html.match(/menuImageUrl\([^)]*image[^)]*\)/g) || [];
  assert.ok(uses.length >= 8, `expected image resolver on every surface, got ${uses.length}`);
});
