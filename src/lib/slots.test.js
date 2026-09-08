import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAvailableSlots } from './slots.js';

const TZ = 'America/Santiago';
const FAR_PAST = new Date('2000-01-01T00:00:00Z');

test('returns all candidate slots when the calendar is empty', () => {
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '11:00' }],
    durationMin: 30,
    busyIntervals: [],
    now: FAR_PAST,
  });
  assert.deepEqual(slots, ['09:00', '09:30', '10:00', '10:30']);
});

test('excludes a slot exactly covered by a busy block', () => {
  const busyStart = new Date('2026-09-08T12:30:00Z'); // 09:30 America/Santiago (winter, -03:00)
  const busyEnd = new Date('2026-09-08T13:00:00Z'); // 10:00 America/Santiago
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '11:00' }],
    durationMin: 30,
    busyIntervals: [{ start: busyStart, end: busyEnd }],
    now: FAR_PAST,
  });
  assert.deepEqual(slots, ['09:00', '10:00', '10:30']);
});

test('excludes a candidate whose duration does not fit before closing', () => {
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '10:00' }],
    durationMin: 90,
    busyIntervals: [],
    now: FAR_PAST,
  });
  assert.deepEqual(slots, []);
});

test('returns no slots for a day with no configured working hours', () => {
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [],
    durationMin: 30,
    busyIntervals: [],
    now: FAR_PAST,
  });
  assert.deepEqual(slots, []);
});

test('excludes slots that have already passed today', () => {
  // "now" = 2026-09-08T13:00:00Z = 10:00 America/Santiago (winter offset -03:00)
  const now = new Date('2026-09-08T13:00:00Z');
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '11:00' }],
    durationMin: 30,
    busyIntervals: [],
    now,
  });
  assert.deepEqual(slots, ['10:00', '10:30']);
});

test('respects multiple working blocks (tramos) in the same day', () => {
  const slots = computeAvailableSlots({
    date: '2026-09-08',
    timeZone: TZ,
    workingBlocks: [
      { start: '09:00', end: '10:00' },
      { start: '14:00', end: '15:00' },
    ],
    durationMin: 30,
    busyIntervals: [],
    now: FAR_PAST,
  });
  assert.deepEqual(slots, ['09:00', '09:30', '14:00', '14:30']);
});

test('produces correct slots across the Chile winter/summer offset change', () => {
  const winter = computeAvailableSlots({
    date: '2026-07-15',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '10:00' }],
    durationMin: 30,
    busyIntervals: [],
    now: FAR_PAST,
  });
  const summer = computeAvailableSlots({
    date: '2026-01-15',
    timeZone: TZ,
    workingBlocks: [{ start: '09:00', end: '10:00' }],
    durationMin: 30,
    busyIntervals: [],
    now: FAR_PAST,
  });
  assert.deepEqual(winter, ['09:00', '09:30']);
  assert.deepEqual(summer, ['09:00', '09:30']);
});
