// Date ranges for admin reports. Boundaries are midnight in Lagos (UTC+1, no
// daylight saving), so "this month" means the month as the admin sees it.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type PeriodKey =
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_30"
  | "last_3_months"
  | "this_year"
  | "all"
  | "custom";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "last_30", label: "Last 30 days" },
  { key: "last_3_months", label: "Last 3 months" },
  { key: "this_year", label: "This year" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom dates" },
];

export interface DateRange {
  key: PeriodKey;
  label: string;
  from: Date | null; // inclusive
  to: Date | null; // exclusive
  fromInput: string;
  toInput: string;
}

// Midnight Lagos time of a calendar date, as a UTC instant.
function lagosMidnight(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d) - LAGOS_OFFSET_MS);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function resolveRange(params: {
  period?: string;
  from?: string;
  to?: string;
}): DateRange {
  const now = new Date();
  const l = new Date(now.getTime() + LAGOS_OFFSET_MS); // Lagos wall clock in UTC fields
  const y = l.getUTCFullYear();
  const m = l.getUTCMonth();
  const d = l.getUTCDate();
  const dow = (l.getUTCDay() + 6) % 7; // Monday = 0
  const tomorrow = lagosMidnight(y, m, d + 1);

  let key = (PERIOD_OPTIONS.find((o) => o.key === params.period)?.key ?? "this_month") as PeriodKey;
  let from: Date | null = null;
  let to: Date | null = null;
  let label = PERIOD_OPTIONS.find((o) => o.key === key)!.label;

  switch (key) {
    case "this_week":
      from = lagosMidnight(y, m, d - dow);
      to = tomorrow;
      break;
    case "last_week":
      from = lagosMidnight(y, m, d - dow - 7);
      to = lagosMidnight(y, m, d - dow);
      break;
    case "this_month":
      from = lagosMidnight(y, m, 1);
      to = tomorrow;
      break;
    case "last_month":
      from = lagosMidnight(y, m - 1, 1);
      to = lagosMidnight(y, m, 1);
      break;
    case "last_30":
      from = lagosMidnight(y, m, d - 29);
      to = tomorrow;
      break;
    case "last_3_months":
      from = lagosMidnight(y, m - 2, 1);
      to = tomorrow;
      break;
    case "this_year":
      from = lagosMidnight(y, 0, 1);
      to = tomorrow;
      break;
    case "all":
      break;
    case "custom": {
      const f = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "") ? params.from! : null;
      const t = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "") ? params.to! : null;
      if (!f && !t) {
        key = "this_month";
        label = "This month";
        from = lagosMidnight(y, m, 1);
        to = tomorrow;
        break;
      }
      if (f) {
        const [fy, fm, fd] = f.split("-").map(Number);
        from = lagosMidnight(fy, fm - 1, fd);
      }
      if (t) {
        const [ty, tm, td] = t.split("-").map(Number);
        to = lagosMidnight(ty, tm - 1, td + 1); // include the end day
      }
      label = `${f ?? "the start"} to ${t ?? "today"}`;
      break;
    }
  }

  const toDate = (dt: Date | null) => {
    if (!dt) return "";
    const x = new Date(dt.getTime() + LAGOS_OFFSET_MS);
    return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
  };
  return {
    key,
    label,
    from,
    to,
    fromInput: key === "custom" ? params.from ?? "" : toDate(from),
    toInput: key === "custom" ? params.to ?? "" : toDate(to ? new Date(to.getTime() - 1) : null),
  };
}
