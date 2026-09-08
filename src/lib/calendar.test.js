import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveEventId,
  queryFreeBusy,
  createBookingEvent,
  getExistingBookingEvent,
  CalendarError,
} from './calendar.js';

function makeFetchMock(responses) {
  const calls = [];
  let i = 0;
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    const r = responses[i++];
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    };
  };
  return { fetchImpl, calls };
}

test('deriveEventId is deterministic for the same idempotency key', async () => {
  const a = await deriveEventId('same-key');
  const b = await deriveEventId('same-key');
  assert.equal(a, b);
});

test('deriveEventId differs for different idempotency keys', async () => {
  const a = await deriveEventId('key-one');
  const b = await deriveEventId('key-two');
  assert.notEqual(a, b);
});

test('deriveEventId only uses characters valid for a Google Calendar event id', async () => {
  const id = await deriveEventId('cualquier-clave-de-idempotencia-del-cliente');
  assert.match(id, /^[0-9a-v]+$/);
  assert.ok(id.length >= 5 && id.length <= 1024);
});

test('queryFreeBusy parses busy intervals from the freeBusy.query response', async () => {
  const { fetchImpl, calls } = makeFetchMock([
    {
      ok: true,
      status: 200,
      body: {
        calendars: {
          'calendar-a@group.calendar.google.com': {
            busy: [{ start: '2026-09-08T13:00:00Z', end: '2026-09-08T13:30:00Z' }],
          },
        },
      },
    },
  ]);

  const busy = await queryFreeBusy({
    accessToken: 'fake-token',
    calendarId: 'calendar-a@group.calendar.google.com',
    timeMin: '2026-09-08T00:00:00Z',
    timeMax: '2026-09-09T00:00:00Z',
    fetchImpl,
  });

  assert.equal(busy.length, 1);
  assert.equal(busy[0].start.toISOString(), '2026-09-08T13:00:00.000Z');
  assert.equal(busy[0].end.toISOString(), '2026-09-08T13:30:00.000Z');
  assert.equal(calls[0].url, 'https://www.googleapis.com/calendar/v3/freeBusy');
});

test('queryFreeBusy throws a CalendarError when the request fails', async () => {
  const { fetchImpl } = makeFetchMock([{ ok: false, status: 403, body: { error: 'forbidden' } }]);
  await assert.rejects(
    () =>
      queryFreeBusy({
        accessToken: 'fake-token',
        calendarId: 'calendar-a@group.calendar.google.com',
        timeMin: 'x',
        timeMax: 'y',
        fetchImpl,
      }),
    CalendarError
  );
});

test('createBookingEvent creates the event with attendees, sendUpdates=all as query param, and opaque transparency', async () => {
  const { fetchImpl, calls } = makeFetchMock([
    { ok: true, status: 200, body: { id: 'evt123', htmlLink: 'https://calendar.google.com/evt123' } },
  ]);

  const result = await createBookingEvent({
    accessToken: 'fake-token',
    calendarId: 'calendar-a@group.calendar.google.com',
    eventId: 'evt123',
    bookingId: 'EV-ABC123',
    summary: 'Corte — Juan Pérez',
    description: 'Reserva: EV-ABC123',
    start: '2026-09-08T15:00:00-03:00',
    end: '2026-09-08T15:30:00-03:00',
    timeZone: 'America/Santiago',
    attendees: [{ email: 'barbero@example.com' }, { email: 'admin@example.com' }],
    fetchImpl,
  });

  assert.equal(result.idempotent, false);
  assert.equal(result.event.id, 'evt123');

  const call = calls[0];
  assert.match(call.url, /^https:\/\/www\.googleapis\.com\/calendar\/v3\/calendars\/calendar-a%40group\.calendar\.google\.com\/events\?sendUpdates=all$/);
  const body = JSON.parse(call.opts.body);
  assert.equal(body.transparency, 'opaque');
  assert.deepEqual(
    body.attendees.map((a) => a.email),
    ['barbero@example.com', 'admin@example.com']
  );
  assert.equal(body.extendedProperties.private.bookingId, 'EV-ABC123');
});

test('createBookingEvent treats a 409 conflict as idempotent success when the existing event matches the same bookingId', async () => {
  const { fetchImpl } = makeFetchMock([
    { ok: false, status: 409, body: { error: 'already exists' } },
    {
      ok: true,
      status: 200,
      body: { id: 'evt123', extendedProperties: { private: { bookingId: 'EV-ABC123' } } },
    },
  ]);

  const result = await createBookingEvent({
    accessToken: 'fake-token',
    calendarId: 'calendar-a@group.calendar.google.com',
    eventId: 'evt123',
    bookingId: 'EV-ABC123',
    summary: 'Corte — Juan Pérez',
    description: 'Reserva: EV-ABC123',
    start: '2026-09-08T15:00:00-03:00',
    end: '2026-09-08T15:30:00-03:00',
    timeZone: 'America/Santiago',
    attendees: [],
    fetchImpl,
  });

  assert.equal(result.idempotent, true);
  assert.equal(result.event.id, 'evt123');
});

test('createBookingEvent rejects a 409 conflict when the existing event belongs to a different booking', async () => {
  const { fetchImpl } = makeFetchMock([
    { ok: false, status: 409, body: { error: 'already exists' } },
    {
      ok: true,
      status: 200,
      body: { id: 'evt123', extendedProperties: { private: { bookingId: 'EV-OTHER999' } } },
    },
  ]);

  await assert.rejects(
    () =>
      createBookingEvent({
        accessToken: 'fake-token',
        calendarId: 'calendar-a@group.calendar.google.com',
        eventId: 'evt123',
        bookingId: 'EV-ABC123',
        summary: 'Corte — Juan Pérez',
        description: 'Reserva: EV-ABC123',
        start: '2026-09-08T15:00:00-03:00',
        end: '2026-09-08T15:30:00-03:00',
        timeZone: 'America/Santiago',
        attendees: [],
        fetchImpl,
      }),
    CalendarError
  );
});

// ── El cuerpo de la respuesta de Calendar no entra al mensaje de error ──
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
const FUGA_CAL = FIXTURE;

function respuestaConFuga(status) {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () =>
      JSON.stringify({
        error: {
          code: status,
          message: `Not Found: ${FUGA_CAL.calendarId} for ${FUGA_CAL.correo}`,
          errors: [{ domain: 'global', reason: 'notFound', message: `token ${FUGA_CAL.accessToken}` }],
        },
      }),
  };
}

function assertSinFuga(err, operacion, status) {
  for (const [nombre, valor] of Object.entries(FUGA_CAL)) {
    assert.ok(!err.message.includes(valor), `filtró ${nombre}: ${err.message}`);
  }
  assert.ok(!err.message.includes('Not Found:'));
  assert.match(err.message, new RegExp(operacion.replace(/\./g, '\\.')));
  assert.match(err.message, new RegExp(String(status)));
  return true;
}

test('a failed freeBusy never carries the Calendar response body into the error', async () => {
  await assert.rejects(
    () =>
      queryFreeBusy({
        accessToken: 'tok',
        calendarId: 'cal',
        timeMin: '2026-09-08T00:00:00Z',
        timeMax: '2026-09-09T00:00:00Z',
        fetchImpl: async () => respuestaConFuga(404),
      }),
    (err) => assertSinFuga(err, 'calendar.freeBusy', 404)
  );
});

test('a failed events.insert never carries the Calendar response body into the error', async () => {
  await assert.rejects(
    () =>
      createBookingEvent({
        accessToken: 'tok',
        calendarId: 'cal',
        eventId: 'abcde',
        bookingId: 'EV-TEST',
        summary: 's',
        description: 'd',
        start: '2026-09-08T15:00:00-03:00',
        end: '2026-09-08T15:30:00-03:00',
        timeZone: 'America/Santiago',
        attendees: [],
        fetchImpl: async () => respuestaConFuga(403),
      }),
    (err) => assertSinFuga(err, 'calendar.events.insert', 403)
  );
});

test('a failed events.get never carries the Calendar response body into the error', async () => {
  await assert.rejects(
    () =>
      getExistingBookingEvent({
        accessToken: 'tok',
        calendarId: 'cal',
        eventId: 'abcde',
        fetchImpl: async () => respuestaConFuga(500),
      }),
    (err) => assertSinFuga(err, 'calendar.events.get', 500)
  );
});
