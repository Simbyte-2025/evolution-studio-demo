import { zonedTimeToUtc } from './time.js';

function timeStrToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Computes candidate start times ("HH:MM") for a given day, given working
// blocks (tramos), a service duration, and already-busy intervals. Rejects
// candidates that don't fully fit before the block closes, overlap a busy
// interval, or fall before `now` (+ optional minimum advance notice).
export function computeAvailableSlots({
  date,
  timeZone,
  workingBlocks,
  durationMin,
  busyIntervals,
  now,
  minAdvanceMin = 0,
  stepMin = 30,
}) {
  const slots = [];

  for (const block of workingBlocks) {
    const blockEndMin = timeStrToMinutes(block.end);
    let cursorMin = timeStrToMinutes(block.start);

    while (cursorMin + durationMin <= blockEndMin) {
      const label = minutesToTimeStr(cursorMin);
      const startInstant = zonedTimeToUtc(date, label, timeZone);
      const endInstant = new Date(startInstant.getTime() + durationMin * 60000);
      const earliestBookable = new Date(now.getTime() + minAdvanceMin * 60000);

      const isPast = startInstant.getTime() < earliestBookable.getTime();
      const overlapsBusy = busyIntervals.some(
        (busy) => startInstant < busy.end && endInstant > busy.start
      );

      if (!isPast && !overlapsBusy) {
        slots.push(label);
      }

      cursorMin += stepMin;
    }
  }

  return slots;
}
