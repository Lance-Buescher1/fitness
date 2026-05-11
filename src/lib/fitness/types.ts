export type FitnessDay = {
  date: string;
  caloriesBurned: number;
  weight: number | null;
  workoutCompleted: boolean;
};

/** Manual sheet row before merging with HealthKit stats (`health_stats.csv`). */
export type ManualFitnessDay = {
  date: string;
  caloriesBurned: number | null;
  weight: number | null;
  workoutCompleted: boolean;
};
