export type HeatmapMetric = "calories" | "workout";

export type HeatmapCell = {
  isoDate: string;
  caloriesBurned: number | null;
  workoutCompleted: boolean | null;
  intensity: number;
  /** Padding week outside the real date range (uniform panel width). */
  isPlaceholder?: boolean;
};
