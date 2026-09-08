import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBooking } from './bookings.js';
import { ApiError } from '../lib/errors.js';
import { deriveEventId } from '../lib/calendar.js';

const FAKE_ENV = {
  GOOGLE_CLIENT_ID: 'fake-client-id',
  GOOGLE_CLIENT_SECRET: 'fake-client-secret',
  GOOGLE_REFRESH_TOKEN: 'fake-refresh-token',
  BUSINESS_TIMEZONE: 'America/Santiago',
  GOOGLE_CALENDAR_ID_BARBER_A: 'calendar-a@group.calendar.google.com',
  BARBER_A_EMAIL: 'barbero-a@example.com',
  OWNER_EMAIL: 'owner@example.com',
};

const VALID_INPUT = {
  serviceId: '8', // Corte Clásico, 30 min
  barberId: '1', // Leonardo -> barbero A
  date: '2026-09-08',
  time: '15:00',
  name: 'Juan Pérez',
  phone: '+56912345678',
  idempotencyKey: 'client-generated-key-abc',
};

function makeFetchMock(handlers) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    for (const [pattern, respond] of handlers) {
      if (url.includes(pattern)) return respond(calls.length);
    }
    throw new Error(`unexpected fetch to ${url}`);
  };
  return { fetchImpl, calls };
}

function jsonResponse(status, body) {
  return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) };
}

test('createBooking confirms a valid booking when the slot is free', async () => {
  const { fetchImpl, calls } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    ['/events/', () => jsonResponse(404, { error: 'not found' })], // pre-check: primer intento, no existe
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(200, { id: 'evt-created' })],
  ]);

  const result = await createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl });

  assert.match(result.bookingId, /^EV-/);
  assert.equal(result.calendarEventId, 'evt-created');
  assert.equal(result.idempotent, false);

  const insertCall = calls.find((c) => c.url.includes('/events?sendUpdates=all'));
  const body = JSON.parse(insertCall.opts.body);
  assert.deepEqual(
    body.attendees.map((a) => a.email),
    ['barbero-a@example.com', 'owner@example.com']
  );
});

test('createBooking responds 409 SLOT_UNAVAILABLE when freeBusy reports an overlapping event', async () => {
  const { fetchImpl } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    ['/events/', () => jsonResponse(404, { error: 'not found' })], // pre-check: no es un reintento
    [
      'freeBusy',
      () =>
        jsonResponse(200, {
          calendars: {
            'calendar-a@group.calendar.google.com': {
              busy: [{ start: '2026-09-08T18:00:00Z', end: '2026-09-08T18:30:00Z' }], // 15:00 America/Santiago
            },
          },
        }),
    ],
  ]);

  await assert.rejects(
    () => createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl }),
    (err) => err instanceof ApiError && err.status === 409 && err.code === 'SLOT_UNAVAILABLE'
  );
});

test('createBooking does not confirm the reservation when events.insert fails', async () => {
  const { fetchImpl } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    ['/events/', () => jsonResponse(404, { error: 'not found' })], // pre-check: no es un reintento
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(500, { error: 'internal' })],
  ]);

  await assert.rejects(
    () => createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl }),
    (err) => err instanceof ApiError && err.code === 'CALENDAR_CREATE_FAILED'
  );
});

test('createBooking resolves a 409 event-id conflict as idempotent success when the mocked insert itself returns 409', async () => {
  const eventId = await deriveEventId(VALID_INPUT.idempotencyKey);
  const expectedBookingId = `EV-${eventId.slice(0, 8).toUpperCase()}`;

  let eventsByIdCallCount = 0;
  const { fetchImpl } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    [
      '/events/',
      () => {
        eventsByIdCallCount += 1;
        // 1ra llamada = pre-check (todavía no existe); 2da = resolución
        // post-409 (ya existe, mismo bookingId que esta reserva).
        if (eventsByIdCallCount === 1) return jsonResponse(404, { error: 'not found' });
        return jsonResponse(200, {
          id: eventId,
          extendedProperties: { private: { bookingId: expectedBookingId } },
        });
      },
    ],
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(409, { error: 'already exists' })],
  ]);

  const result = await createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl });

  assert.equal(result.bookingId, expectedBookingId);
  assert.equal(result.calendarEventId, eventId);
  assert.equal(result.idempotent, true);
});

// Simula un calendario real con estado compartido entre llamadas: freeBusy
// refleja los eventos efectivamente creados (no un mock ciego que siempre
// dice "libre"). Esto es lo único que puede exponer el bug real: un
// reintento con la misma idempotencyKey vuelve a consultar freeBusy, y esa
// consulta ahora reporta ocupado por el propio evento creado en el primer
// intento — si el backend no distingue "ocupado por mí mismo" de "ocupado
// por otro", el reintento recibe 409 SLOT_UNAVAILABLE en vez de éxito
// idempotente.
function makeStatefulCalendarMock() {
  const events = new Map(); // eventId -> { id, start, end, extendedProperties }
  const calls = [];

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
  }

  const fetchImpl = async (url, opts) => {
    const method = opts?.method ?? 'GET';
    calls.push({ url, method });

    if (url.includes('oauth2.googleapis.com/token')) {
      return jsonResponse(200, { access_token: 'tok', expires_in: 3599 });
    }

    if (url.includes('/freeBusy')) {
      const { timeMin, timeMax } = JSON.parse(opts.body);
      const busy = [...events.values()]
        .filter((e) => overlaps(e.start.dateTime, e.end.dateTime, timeMin, timeMax))
        .map((e) => ({ start: e.start.dateTime, end: e.end.dateTime }));
      return jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy } } });
    }

    if (url.includes('/events?sendUpdates=all') && method === 'POST') {
      const body = JSON.parse(opts.body);
      if (events.has(body.id)) return jsonResponse(409, { error: 'already exists' });
      events.set(body.id, body);
      return jsonResponse(200, body);
    }

    if (/\/events\/[^/?]+$/.test(url) && method === 'GET') {
      const id = decodeURIComponent(url.split('/events/')[1]);
      const existing = events.get(id);
      return existing ? jsonResponse(200, existing) : jsonResponse(404, { error: 'not found' });
    }

    throw new Error(`unexpected fetch to ${url} (${method})`);
  };

  return { fetchImpl, calls };
}

test('two independent, sequential /api/bookings calls with the same idempotencyKey produce exactly one event and an idempotent second response', async () => {
  const { fetchImpl, calls } = makeStatefulCalendarMock();

  const first = await createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl });
  assert.equal(first.idempotent, false);

  const callsBeforeRetry = calls.length;

  const second = await createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl });

  assert.equal(second.idempotent, true);
  assert.equal(second.bookingId, first.bookingId);
  assert.equal(second.calendarEventId, first.calendarEventId);

  // El segundo intento debe resolverse con el pre-check (GET por id) y NO
  // debe volver a llamar freeBusy ni events.insert.
  const retryCalls = calls.slice(callsBeforeRetry);
  assert.equal(
    retryCalls.filter((c) => c.url.includes('/freeBusy')).length,
    0,
    'el reintento no debería volver a consultar freeBusy'
  );
  assert.equal(
    retryCalls.filter((c) => c.url.includes('/events?sendUpdates=all')).length,
    0,
    'el reintento no debería volver a intentar events.insert'
  );
});

// ── Notas del cliente y normalización de teléfono ──────────────────────
// El campo "Notas" existe en el formulario aprobado. Si el backend lo
// descarta en silencio, un cliente que escribe "soy alérgico al tinte"
// recibe confirmación y el barbero nunca se entera. Estos tests miran el
// payload real de events.insert, no el valor de retorno.

function makeInsertCapturingMock() {
  const { fetchImpl, calls } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    ['/events/', () => jsonResponse(404, { error: 'not found' })],
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(200, { id: 'evt-created' })],
  ]);
  const insertedEvent = () => JSON.parse(calls.find((c) => c.url.includes('/events?sendUpdates=all')).opts.body);
  return { fetchImpl, insertedEvent };
}

test('the client notes reach the event description so the barber can read them', async () => {
  const { fetchImpl, insertedEvent } = makeInsertCapturingMock();

  await createBooking({
    input: { ...VALID_INPUT, notes: 'Soy alérgico al tinte' },
    env: FAKE_ENV,
    fetchImpl,
  });

  assert.match(insertedEvent().description, /Notas: Soy alérgico al tinte/);
});

test('a booking without notes does not add an empty Notas line', async () => {
  const { fetchImpl, insertedEvent } = makeInsertCapturingMock();

  await createBooking({ input: { ...VALID_INPUT, notes: '   ' }, env: FAKE_ENV, fetchImpl });

  assert.doesNotMatch(insertedEvent().description, /Notas:/);
});

test('rejects notes longer than the limit instead of truncating them silently', async () => {
  const { fetchImpl } = makeInsertCapturingMock();

  await assert.rejects(
    () => createBooking({ input: { ...VALID_INPUT, notes: 'x'.repeat(501) }, env: FAKE_ENV, fetchImpl }),
    (err) => err instanceof ApiError && err.status === 400 && err.code === 'INVALID_NOTES'
  );
});

test('accepts a phone with spaces, dashes and parentheses and normalizes it for Calendar', async () => {
  const { fetchImpl, insertedEvent } = makeInsertCapturingMock();

  const result = await createBooking({
    input: { ...VALID_INPUT, phone: '(+56) 9 1234-5678' },
    env: FAKE_ENV,
    fetchImpl,
  });

  assert.match(result.bookingId, /^EV-/);
  // El barbero lee un número agrupado y sin ambigüedad de país.
  assert.match(insertedEvent().description, /Teléfono: \+56 9 1234 5678/);
});

test('still rejects a phone that is not a phone number', async () => {
  const { fetchImpl } = makeInsertCapturingMock();

  await assert.rejects(
    () => createBooking({ input: { ...VALID_INPUT, phone: 'llámame al local' }, env: FAKE_ENV, fetchImpl }),
    (err) => err instanceof ApiError && err.code === 'INVALID_PHONE'
  );
});
