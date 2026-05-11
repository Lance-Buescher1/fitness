export type HeatmapMetric = "calories" | "workout";

export type HeatmapCell = {
  isoDate: string;
  caloriesBurned: number | null;
  workoutCompleted: boolean | null;
  intensity: number;
};
