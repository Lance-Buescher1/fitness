/** End-of-grid anchor: Saturday of the calendar week containing `d` (local). */
export function saturdayOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const delta = (6 - dow + 7) % 7;
  x.setDate(x.getDate() + delta);
  return x;
}
