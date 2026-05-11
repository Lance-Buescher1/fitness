export function parseBooleanLoose(value: string | undefined): boolean {
  if (value == null) return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

/**
 * Empty or whitespace-only `workout_completed` cell → not logged (`null`).
 * Explicit false/true tokens stay boolean.
 */
export function parseWorkoutCompletedField(value: string | undefined): boolean | null {
  if (value == null) return null;
  const v = value.trim();
  if (v === "") return null;
  const lower = v.toLowerCase();
  if (lower === "true" || lower === "1" || lower === "yes" || lower === "y") return true;
  if (lower === "false" || lower === "0" || lower === "no" || lower === "n") return false;
  return null;
}
