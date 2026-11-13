const dateTimeFormat = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "12 nov 2026, 14:30" */
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

/** "hace 3 horas", "ayer", "ahora"... */
export function formatRelative(iso: string, now: Date = new Date()) {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "ahora";
}

const number1 = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("es", { style: "percent", maximumFractionDigits: 0 });
const shortDay = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Duración legible: "45 min", "23,7 h", "3,2 días". */
export function formatDuration(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${number1.format(hours)} h`;
  return `${number1.format(hours / 24)} días`;
}

export const formatPercent = (ratio: number) => percent.format(ratio);

/** Las fechas de la serie diaria llegan como "YYYY-MM-DD" (días UTC). */
const utcDate = (day: string) => new Date(`${day}T00:00:00Z`);
export const formatShortDay = (day: string) => shortDay.format(utcDate(day)).replace(".", "");
export const formatLongDay = (day: string) => longDay.format(utcDate(day));

/** Iniciales para el avatar: "Ana Admin" → "AA". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
