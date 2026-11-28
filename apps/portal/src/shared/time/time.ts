const CAIRO_TIME_ZONE = "Africa/Cairo";
const MINUTE_MS = 60_000;
const SEARCH_RADIUS_MS = 36 * 60 * MINUTE_MS;
const OFFSET_SAMPLE_STEP_MS = 30 * MINUTE_MS;
const CAIRO_START_OF_DAY = "00:00";
const CAIRO_END_OF_DAY = "23:59";

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type AmbiguousTimeChoice = "earlier" | "later";

const cairoPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CAIRO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parseLocalDateTime(value: string): LocalDateTimeParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new RangeError("Expected a local date-time in YYYY-MM-DDTHH:mm format.");
  const [, year, month, day, hour, minute] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() + 1 !== parts.month ||
    date.getUTCDate() !== parts.day ||
    parts.hour > 23 ||
    parts.minute > 59
  ) {
    throw new RangeError("The local date-time is invalid.");
  }
  return parts;
}

function partsAsUtc(parts: LocalDateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

function getCairoParts(date: Date): LocalDateTimeParts & { second: number } {
  const values = Object.fromEntries(
    cairoPartsFormatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getOffsetMinutes(instantMs: number): number {
  const instant = new Date(instantMs);
  const parts = getCairoParts(instant);
  const representedUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return (representedUtc - Math.floor(instantMs / 1000) * 1000) / MINUTE_MS;
}

function sameWallTime(date: Date, expected: LocalDateTimeParts): boolean {
  const actual = getCairoParts(date);
  return (
    actual.year === expected.year &&
    actual.month === expected.month &&
    actual.day === expected.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute
  );
}

function findMatchingInstants(parts: LocalDateTimeParts): Date[] {
  const wallTimeMs = partsAsUtc(parts);
  const offsets = new Set<number>();
  for (
    let sample = wallTimeMs - SEARCH_RADIUS_MS;
    sample <= wallTimeMs + SEARCH_RADIUS_MS;
    sample += OFFSET_SAMPLE_STEP_MS
  ) {
    offsets.add(getOffsetMinutes(sample));
  }
  return [...offsets]
    .map((offset) => new Date(wallTimeMs - offset * MINUTE_MS))
    .filter((instant) => sameWallTime(instant, parts))
    .sort((left, right) => left.getTime() - right.getTime());
}

/** Converts a Cairo wall-clock input into an ISO UTC timestamp. Ambiguous times need an explicit choice; nonexistent times throw. */
export function cairoLocalToIso(value: string, choice?: AmbiguousTimeChoice): string {
  const parts = parseLocalDateTime(value);
  const instants = findMatchingInstants(parts);
  if (instants.length === 0) throw new RangeError("This Cairo local time does not exist.");
  if (instants.length > 1 && choice === undefined) {
    throw new RangeError("This Cairo local time is ambiguous; choose earlier or later.");
  }
  const selected = choice === "later" ? instants.at(-1) : instants[0];
  if (!selected) throw new RangeError("This Cairo local time could not be resolved.");
  return selected.toISOString();
}

/** Converts a Cairo calendar date to its UTC start or end boundary.
 * @param value Local date in YYYY-MM-DD format.
 * @param boundary Selects the first or last minute of that Cairo date.
 * @returns ISO UTC instant for API window fields.
 */
export function cairoDateBoundaryToIso(value: string, boundary: "startOfDay" | "endOfDay"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError("Expected a local date in YYYY-MM-DD format.");
  const time = boundary === "startOfDay" ? CAIRO_START_OF_DAY : CAIRO_END_OF_DAY;
  return cairoLocalToIso(`${value}T${time}`);
}

/** Converts a user-entered Cairo wall-clock value to ISO, returning undefined when DST makes it invalid.
 * @param value Native datetime-local value.
 * @param choice Resolution for the repeated wall-clock hour at a DST fall-back.
 */
export function tryCairoLocalToIso(
  value: string,
  choice: AmbiguousTimeChoice = "earlier",
): string | undefined {
  try {
    return cairoLocalToIso(value, choice);
  } catch {
    return undefined;
  }
}

/** Converts an ISO timestamp to the value accepted by a native datetime-local field in Cairo time. */
export function isoToCairoLocal(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError("Expected a valid ISO timestamp.");
  const parts = getCairoParts(date);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/** Converts an ISO timestamp to Cairo wall-clock input, returning undefined for invalid URL state.
 * @param value Candidate timestamp restored from list filters.
 */
export function tryIsoToCairoLocal(value: string): string | undefined {
  try {
    return isoToCairoLocal(value);
  } catch {
    return undefined;
  }
}

/** Formats an ISO timestamp for display in the configured Cairo time zone. */
export function formatCairoDateTime(value: Date | string, locale = "en-EG"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CAIRO_TIME_ZONE,
  }).format(value instanceof Date ? value : new Date(value));
}

/** Returns whether an ISO timestamp precedes the injected clock value. */
export function isBeforeNow(value: string, now: Date): boolean {
  return new Date(value).getTime() < now.getTime();
}

/** Returns whether an ISO timestamp follows the injected clock value. */
export function isAfterNow(value: string, now: Date): boolean {
  return new Date(value).getTime() > now.getTime();
}

/** Compares two ISO timestamps without converting calendar zones in callers. */
export function isAfterTimestamp(value: string, comparison: string): boolean {
  return new Date(value).getTime() > new Date(comparison).getTime();
}

/** Formats a display-only countdown using a target and server timestamp; it never decides availability. */
export function formatRemainingFromServer(target: string, serverNow: string): string {
  const remainingSeconds = Math.max(
    0,
    Math.floor((Date.parse(target) - Date.parse(serverNow)) / 1000),
  );
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}
