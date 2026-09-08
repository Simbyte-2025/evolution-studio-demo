import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildConfigResponse } from './config.js';

test('buildConfigResponse exposes only the two active barbers, without internal env-key metadata', () => {
  const config = buildConfigResponse();
  assert.equal(config.barberos.length, 2);
  const serialized = JSON.stringify(config);
  assert.doesNotMatch(serialized, /calendarEnvKey/);
  assert.doesNotMatch(serialized, /emailEnvKey/);
  assert.doesNotMatch(serialized, /GOOGLE_/);
});

test('buildConfigResponse exposes all 7 DEMO services with pricing/duration for the UI', () => {
  const config = buildConfigResponse();
  assert.equal(config.servicios.length, 7);
  assert.ok(config.servicios.every((s) => typeof s.duracion_min === 'number'));
});
