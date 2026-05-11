export const FITNESS_CSV_HEADERS = [
  "date",
  "calories_burned",
  "weight",
  "workout_completed",
] as const;

export type FitnessCsvHeader = (typeof FITNESS_CSV_HEADERS)[number];
