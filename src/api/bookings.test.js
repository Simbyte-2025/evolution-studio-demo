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
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(500, { error: 'internal' })],
  ]);

  await assert.rejects(
    () => createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl }),
    (err) => err instanceof ApiError && err.code === 'CALENDAR_CREATE_FAILED'
  );
});

test('createBooking is idempotent: retrying the same idempotencyKey after a 409 event-id conflict returns success without duplicating', async () => {
  const eventId = await deriveEventId(VALID_INPUT.idempotencyKey);
  const expectedBookingId = `EV-${eventId.slice(0, 8).toUpperCase()}`;

  const { fetchImpl } = makeFetchMock([
    ['oauth2.googleapis.com/token', () => jsonResponse(200, { access_token: 'tok', expires_in: 3599 })],
    ['freeBusy', () => jsonResponse(200, { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } })],
    ['/events?sendUpdates=all', () => jsonResponse(409, { error: 'already exists' })],
    [
      '/events/',
      () =>
        jsonResponse(200, {
          id: eventId,
          extendedProperties: { private: { bookingId: expectedBookingId } },
        }),
    ],
  ]);

  const result = await createBooking({ input: VALID_INPUT, env: FAKE_ENV, fetchImpl });

  assert.equal(result.bookingId, expectedBookingId);
  assert.equal(result.calendarEventId, eventId);
  assert.equal(result.idempotent, true);
});
