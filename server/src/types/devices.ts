export interface ActivityData {
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  bmr: number;
  heartRate?: number;
  weight?: number;
  bodyFat?: number;
  sleepHours?: number;
  distance?: number;
}

export interface DailyBalance {
  caloriesIn: number;
  caloriesOut: number;
  balance: number;
  balanceStatus: "balanced" | "slight_imbalance" | "significant_imbalance";
}
