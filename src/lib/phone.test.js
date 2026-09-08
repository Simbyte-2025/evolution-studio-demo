import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from './phone.js';

test('accepts the everyday Chilean formats a client actually types', async (t) => {
  // Todos son el mismo número escrito de las formas habituales.
  const variants = [
    '+56 9 1234 5678',
    '+56912345678',
    '(+56) 9 1234 5678',
    '56 9 1234 5678',
    '912345678',
    '9 1234-5678',
    '9-1234-5678',
    '(9) 1234 5678',
  ];

  for (const raw of variants) {
    await t.test(raw, () => {
      const result = normalizePhone(raw);
      assert.notEqual(result, null, `debería aceptar ${raw}`);
      assert.equal(result.e164, '+56912345678');
      assert.equal(result.display, '+56 9 1234 5678');
    });
  }
});

test('keeps a foreign number as dialed instead of inventing a country code', () => {
  const result = normalizePhone('+1 (415) 555-2671');
  assert.equal(result.e164, '+14155552671');
  // No es un móvil chileno: no se le aplica el agrupamiento chileno.
  assert.equal(result.display, '+14155552671');
});

test('keeps a Chilean landline without inventing a mobile prefix', () => {
  const result = normalizePhone('(2) 2345 6789');
  assert.equal(result.e164, '+56223456789');
  assert.equal(result.display, '+56223456789');
});

test('does not invent a country code for an ambiguous local number', () => {
  const result = normalizePhone('2345 6789');
  assert.equal(result.e164, '23456789');
  assert.equal(result.display, '23456789');
});

test('rejects input that is not a phone number', () => {
  for (const raw of ['', '   ', 'llámame', '+', '12345', '9123456789012345678', '+56 9 1234 567a', null, undefined]) {
    assert.equal(normalizePhone(raw), null, `debería rechazar ${JSON.stringify(raw)}`);
  }
});
