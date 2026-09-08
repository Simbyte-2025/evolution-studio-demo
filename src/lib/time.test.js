import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTimeZoneOffsetMinutes, zonedTimeToUtc, formatRfc3339 } from './time.js';

const TZ = 'America/Santiago';

test('getTimeZoneOffsetMinutes returns -180 (GMT-03:00) in Chilean summer (January)', () => {
  const offset = getTimeZoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), TZ);
  assert.equal(offset, -180);
});

test('getTimeZoneOffsetMinutes returns -240 (GMT-04:00) in Chilean winter (July)', () => {
  const offset = getTimeZoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), TZ);
  assert.equal(offset, -240);
});

test('zonedTimeToUtc converts a Santiago summer local time to the correct UTC instant', () => {
  const instant = zonedTimeToUtc('2026-01-15', '10:00', TZ);
  assert.equal(instant.toISOString(), '2026-01-15T13:00:00.000Z');
});

test('zonedTimeToUtc converts a Santiago winter local time to the correct UTC instant', () => {
  const instant = zonedTimeToUtc('2026-07-15', '10:00', TZ);
  assert.equal(instant.toISOString(), '2026-07-15T14:00:00.000Z');
});

test('formatRfc3339 renders local wall time with the correct summer offset suffix', () => {
  const instant = new Date('2026-01-15T13:00:00.000Z');
  assert.equal(formatRfc3339(instant, TZ), '2026-01-15T10:00:00-03:00');
});

test('formatRfc3339 renders local wall time with the correct winter offset suffix', () => {
  const instant = new Date('2026-07-15T14:00:00.000Z');
  assert.equal(formatRfc3339(instant, TZ), '2026-07-15T10:00:00-04:00');
});
