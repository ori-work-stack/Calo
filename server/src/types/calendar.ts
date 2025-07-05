export interface DayData {
  date: string;
  caloriesGoal: number;
  caloriesActual: number;
  proteinGoal: number;
  proteinActual: number;
  carbsGoal: number;
  carbsActual: number;
  fatGoal: number;
  fatActual: number;
  mealCount: number;
  qualityScore: number;
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
