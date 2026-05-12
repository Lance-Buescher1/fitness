export type FitnessDay = {
  date: string;
  /** `null` = not logged (no HealthKit row and empty cell in manual CSV). */
  caloriesBurned: number | null;
  weight: number | null;
  /** `null` = not logged (empty `workout_completed` cell); `false` = explicit rest / no workout. */
  workoutCompleted: boolean | null;
};

/** Manual sheet row before merging with HealthKit stats (`health_stats.csv`). */
export type ManualFitnessDay = {
  date: string;
  caloriesBurned: number | null;
  weight: number | null;
  workoutCompleted: boolean | null;
};
