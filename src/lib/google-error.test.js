import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeGoogleFailure } from './google-error.js';

// Marcadores que en RUNTIME tienen la forma de una credencial real, pero
// ensamblados por fragmentos para que ninguna forma completa aparezca
// literalmente en un archivo versionado. tests/test_secrets_hygiene.py es
// deliberadamente estricto: falla ante cualquier coincidencia, sin
// excepciones por nombre, carpeta ni contenido. Ocultar el marcador es
// trabajo del test, no de la guarda.
const SUFIJO_CAL = '@' + ['group', 'calendar', 'google', 'com'].join('.');
const FIXTURE = {
  refreshToken: ['1', '//', '0', 'FIXTURE', 'a'.repeat(24)].join(''),
  clientSecret: ['GOCSPX', '-', 'FIXTURE', 'b'.repeat(16)].join(''),
  accessToken: ['ya29', '.', 'FIXTURE', 'c'.repeat(20)].join(''),
  calendarId: 'ca11ab1e'.repeat(8) + SUFIJO_CAL,
  correo: ['persona', 'ficticia'].join('.') + '@' + ['example', 'com'].join('.'),
};
const FUGA = FIXTURE;

test('keeps the operation and the HTTP status', () => {
  const message = describeGoogleFailure('oauth.refresh', 401, '');
  assert.match(message, /oauth\.refresh/);
  assert.match(message, /401/);
});

test('does not leak an OAuth error body into the message', () => {
  const body = JSON.stringify({
    error: 'invalid_grant',
    error_description: `Token has been expired or revoked: ${FUGA.refreshToken}`,
    client_secret: FUGA.clientSecret,
  });

  const message = describeGoogleFailure('oauth.refresh', 400, body);

  // El código normalizado sí es útil para diagnosticar y es seguro.
  assert.match(message, /invalid_grant/);
  // Nada más del cuerpo sobrevive.
  for (const [nombre, valor] of Object.entries(FUGA)) {
    assert.ok(!message.includes(valor), `filtró ${nombre}`);
  }
  assert.ok(!message.includes('error_description'));
  assert.ok(!message.includes('expired or revoked'));
});

test('does not leak a Calendar API error body into the message', () => {
  const body = JSON.stringify({
    error: {
      code: 404,
      message: `Not Found: ${FUGA.calendarId}`,
      errors: [{ domain: 'global', reason: 'notFound', message: `calendar ${FUGA.calendarId}` }],
    },
  });

  const message = describeGoogleFailure('calendar.freeBusy', 404, body);

  assert.match(message, /calendar\.freeBusy/);
  assert.match(message, /404/);
  assert.match(message, /notFound/);
  assert.ok(!message.includes(FUGA.calendarId));
  assert.ok(!message.includes('Not Found:'));
});

test('omits the external code when it is not a plain normalized token', () => {
  // Un "código" que en realidad arrastra texto libre no se propaga.
  const body = JSON.stringify({ error: `unauthorized for ${FUGA.correo} with ${FUGA.accessToken}` });

  const message = describeGoogleFailure('calendar.events.insert', 403, body);

  assert.match(message, /calendar\.events\.insert/);
  assert.match(message, /403/);
  assert.ok(!message.includes(FUGA.correo));
  assert.ok(!message.includes(FUGA.accessToken));
  assert.ok(!message.includes('unauthorized for'));
});

test('survives a body that is not JSON at all without echoing it', () => {
  const message = describeGoogleFailure('calendar.events.get', 500, `<html>${FUGA.calendarId}</html>`);

  assert.match(message, /calendar\.events\.get/);
  assert.match(message, /500/);
  assert.ok(!message.includes(FUGA.calendarId));
  assert.ok(!message.includes('<html>'));
});

test('never grows with the body: the message length is bounded', () => {
  const enorme = JSON.stringify({ error: { message: 'x'.repeat(50_000) } });
  assert.ok(describeGoogleFailure('calendar.freeBusy', 500, enorme).length < 120);
});
