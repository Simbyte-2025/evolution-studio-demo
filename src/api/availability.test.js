import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAvailabilityForRequest } from './availability.js';
import { ApiError } from '../lib/errors.js';

const FAKE_ENV = {
  GOOGLE_CLIENT_ID: 'fake-client-id',
  GOOGLE_CLIENT_SECRET: 'fake-client-secret',
  GOOGLE_REFRESH_TOKEN: 'fake-refresh-token',
  BUSINESS_TIMEZONE: 'America/Santiago',
  GOOGLE_CALENDAR_ID_BARBER_A: 'calendar-a@group.calendar.google.com',
};

function makeFetchMock(responsesByUrl) {
  const fetchImpl = async (url) => {
    const match = Object.entries(responsesByUrl).find(([pattern]) => url.includes(pattern));
    if (!match) throw new Error(`unexpected fetch to ${url}`);
    const r = match[1];
    return { ok: r.ok, status: r.status, json: async () => r.body, text: async () => JSON.stringify(r.body) };
  };
  return fetchImpl;
}

test('computeAvailabilityForRequest returns slots for an active service/barber with an empty calendar', async () => {
  const fetchImpl = makeFetchMock({
    'oauth2.googleapis.com/token': { ok: true, status: 200, body: { access_token: 'tok', expires_in: 3599 } },
    'freeBusy': { ok: true, status: 200, body: { calendars: { 'calendar-a@group.calendar.google.com': { busy: [] } } } },
  });

  const result = await computeAvailabilityForRequest({
    serviceId: '8', // Corte Clásico, 30 min
    barberId: '1', // Leonardo -> barbero A
    date: '2026-09-08',
    env: FAKE_ENV,
    now: new Date('2000-01-01T00:00:00Z'),
    fetchImpl,
  });

  assert.equal(result.timezone, 'America/Santiago');
  assert.ok(result.slots.includes('15:00'));
});

test('computeAvailabilityForRequest rejects an inactive/unknown barberId', async () => {
  await assert.rejects(
    () =>
      computeAvailabilityForRequest({
        serviceId: '8',
        barberId: '4', // Cristóbal, inactivo
        date: '2026-09-08',
        env: FAKE_ENV,
        fetchImpl: async () => {
          throw new Error('should not fetch for an invalid barber');
        },
      }),
    (err) => err instanceof ApiError && err.code === 'BARBER_NOT_FOUND'
  );
});
