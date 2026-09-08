import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getActiveServices, getActiveBarbers, findBarberById, findServiceById } from './demo-config.js';

test('getActiveServices returns all 7 DEMO services (none disabled)', () => {
  assert.equal(getActiveServices().length, 7);
});

test('getActiveBarbers returns only the two barbers with confirmed DEMO accounts', () => {
  const activos = getActiveBarbers();
  assert.equal(activos.length, 2);
  assert.deepEqual(activos.map((b) => b.nombre).sort(), ['Leonardo', 'Vicente']);
});

test('findBarberById returns null for an inactive barber (not exposed to the real flow)', () => {
  assert.equal(findBarberById(4), null); // Cristóbal, inactivo
});

test('findServiceById returns the service for an active id', () => {
  assert.equal(findServiceById(8)?.nombre, 'Corte Clásico');
});
