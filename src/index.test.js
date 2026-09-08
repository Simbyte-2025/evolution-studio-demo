import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

const FAKE_ENV = {
  GOOGLE_CLIENT_ID: 'x',
  GOOGLE_CLIENT_SECRET: 'y',
  GOOGLE_REFRESH_TOKEN: 'z',
  BUSINESS_TIMEZONE: 'America/Santiago',
  BARBER_A_CALENDAR_ID: 'calendar-a@group.calendar.google.com',
  ASSETS: {
    fetch: async () => new Response('static asset', { status: 200 }),
  },
};

test('GET /api/config returns 200 JSON without hitting Google', async () => {
  const res = await worker.fetch(new Request('https://example.com/api/config'), FAKE_ENV);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.barberos.length, 2);
});

test('GET /reservar falls through to the ASSETS binding (static landing/booking page)', async () => {
  const res = await worker.fetch(new Request('https://example.com/reservar'), FAKE_ENV);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'static asset');
});

test('GET /api/availability with an unknown barberId responds with the mapped error status', async () => {
  const res = await worker.fetch(
    new Request('https://example.com/api/availability?serviceId=8&barberId=999&date=2026-09-08'),
    FAKE_ENV
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'BARBER_NOT_FOUND');
});

test('POST /api/bookings with invalid input responds 400 without touching Google', async () => {
  const res = await worker.fetch(
    new Request('https://example.com/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
    FAKE_ENV
  );
  assert.equal(res.status, 400);
});

// ── La respuesta pública nunca arrastra datos de Google ─────────────────
// index.js no propaga fetchImpl a los endpoints, así que la única forma de
// interceptar la llamada sin salir a la red es sustituir el fetch global.
test('a Google failure never leaks its response body through the public API', async () => {
  const sufijoCal = '@' + ['group', 'calendar', 'google', 'com'].join('.');
  const FUGA = {
    calendarId: 'ca11ab1e'.repeat(8) + sufijoCal,
    refreshToken: ['1', '//', '0', 'FIXTURE', 'a'.repeat(24)].join(''),
    correo: ['persona', 'ficticia'].join('.') + '@' + ['example', 'com'].join('.'),
  };

  const fetchReal = globalThis.fetch;
  let llamadasDeRed = 0;
  globalThis.fetch = async () => {
    llamadasDeRed += 1;
    return {
      ok: false,
      status: 403,
      json: async () => ({}),
      text: async () =>
        JSON.stringify({
          error: {
            code: 403,
            message: `Forbidden for ${FUGA.calendarId} / ${FUGA.correo}`,
            errors: [{ reason: 'forbidden', message: FUGA.refreshToken }],
          },
        }),
    };
  };

  try {
    const worker = (await import('./index.js')).default;
    const url = 'https://demo.test/api/availability?serviceId=8&barberId=1&date=2026-09-22';
    const res = await worker.fetch(new Request(url), FAKE_ENV);
    const body = await res.text();

    // Si esto fuera 0, el mock no se usó y el test no probaría nada.
    assert.ok(llamadasDeRed > 0, 'el fetch simulado nunca se invocó');
    assert.ok(res.status >= 400);
    for (const [nombre, valor] of Object.entries(FUGA)) {
      assert.ok(!body.includes(valor), `la respuesta pública filtró ${nombre}`);
    }
    assert.ok(!body.includes('Forbidden for'));
  } finally {
    globalThis.fetch = fetchReal;
  }
});
