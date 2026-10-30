/** Pickup option for customers in Lagos. */
export const PICKUP_FEE = 2000;
export const PICKUP_LOCATION = "Ipaja, Lagos";
export const PICKUP_DAYS_LABEL = "Thursday to Sunday";

// Thursday, Friday, Saturday, Sunday (JS weekday numbers, Sunday = 0).
const PICKUP_WEEKDAYS = new Set([4, 5, 6, 0]);

/** Today's date in Lagos as YYYY-MM-DD. */
export function todayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

function toUtcDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isPickupDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return false;
  return PICKUP_WEEKDAYS.has(date.getUTCDay());
}

/** A valid pickup date: a Thursday to Sunday, today or later, within 60 days. */
export function isValidPickupDate(value: string): boolean {
  if (!isPickupDay(value)) return false;
  const today = toUtcDate(todayInLagos()).getTime();
  const target = toUtcDate(value).getTime();
  return target >= today && target <= today + 60 * 86400000;
}

export function formatPickupDate(value: string): string {
  return toUtcDate(value).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The next available pickup dates, soonest first. */
export function upcomingPickupDates(count = 12): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const start = toUtcDate(todayInLagos());
  for (let i = 0; out.length < count && i < 60; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const value = d.toISOString().slice(0, 10);
    if (isPickupDay(value)) out.push({ value, label: formatPickupDate(value) });
  }
  return out;
}

/** Digits only, e.g. "0803 123 4567" -> "08031234567". */
export function cleanWhatsapp(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

export function isValidWhatsapp(value: string): boolean {
  return cleanWhatsapp(value).replace(/\D/g, "").length >= 10;
}
