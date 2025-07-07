export interface DayData {
  date: string;
  calories_goal: number;
  calories_actual: number;
  protein_goal: number;
  protein_actual: number;
  carbs_goal: number;
  carbs_actual: number;
  fat_goal: number;
  fat_actual: number;
  meal_count: number;
  quality_score: number;
  events: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

export interface CalendarStats {
  monthlyProgress: number;
  streakDays: number;
  bestWeek: string;
  challengingWeek: string;
  improvementPercent: number;
  totalGoalDays: number;
  averageCalories: number;
  averageProtein: number;
  motivationalMessage: string;
}
