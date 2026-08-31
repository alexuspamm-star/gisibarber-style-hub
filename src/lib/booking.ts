export type WorkHour = {
  weekday: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slot_minutes: number;
};

export const WEEKDAYS = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toLabel(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** All slots for a day, based on the weekly work hours. */
export function buildSlots(hour: WorkHour | undefined) {
  if (!hour || !hour.is_open) return [];
  const start = toMinutes(hour.open_time);
  const end = toMinutes(hour.close_time);
  const step = hour.slot_minutes || 30;
  const slots: string[] = [];
  for (let m = start; m + step <= end; m += step) slots.push(toLabel(m));
  return slots;
}

export function normalizeTime(t: string) {
  return t.slice(0, 5);
}
