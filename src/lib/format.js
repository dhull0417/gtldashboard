const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDate(iso) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function routineSummary(routine) {
  const days = (routine.dayTimes ?? []).map((dt) => `${DAY_NAMES[dt.day] ?? "?"} ${dt.time}`).join(", ");
  return `${capitalize(routine.frequency)}${days ? ` — ${days}` : ""}`;
}

export function digitsOnly(s) {
  return (s ?? "").replace(/\D/g, "");
}

export function formatDisplayName(firstName, lastName) {
  const first = (firstName ?? "").trim();
  const lastInitial = (lastName ?? "").trim()[0];
  if (!first && !lastInitial) return "(no name)";
  if (!lastInitial) return first;
  return `${first} ${lastInitial.toUpperCase()}.`;
}
