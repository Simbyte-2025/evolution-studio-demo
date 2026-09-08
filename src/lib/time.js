export function getTimeZoneOffsetMinutes(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(instant);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(raw);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

// Converts a local wall-clock time in `timeZone` (no fixed UTC offset — Chile
// observes seasonal time change) to the UTC instant it represents.
export function zonedTimeToUtc(dateStr, timeStr, timeZone) {
  const naiveUtcMs = Date.parse(`${dateStr}T${timeStr}:00Z`);
  const firstOffset = getTimeZoneOffsetMinutes(new Date(naiveUtcMs), timeZone);
  let instantMs = naiveUtcMs - firstOffset * 60000;
  const secondOffset = getTimeZoneOffsetMinutes(new Date(instantMs), timeZone);
  if (secondOffset !== firstOffset) {
    instantMs = naiveUtcMs - secondOffset * 60000;
  }
  return new Date(instantMs);
}

export function formatRfc3339(instant, timeZone) {
  const offsetMin = getTimeZoneOffsetMinutes(instant, timeZone);
  const sign = offsetMin <= 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0');
  const offsetMinutes = String(abs % 60).padStart(2, '0');

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${offsetHours}:${offsetMinutes}`;
}
