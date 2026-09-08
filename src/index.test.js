import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

const FAKE_ENV = {
  GOOGLE_CLIENT_ID: 'x',
  GOOGLE_CLIENT_SECRET: 'y',
  GOOGLE_REFRESH_TOKEN: 'z',
  BUSINESS_TIMEZONE: 'America/Santiago',
  GOOGLE_CALENDAR_ID_BARBER_A: 'calendar-a@group.calendar.google.com',
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
