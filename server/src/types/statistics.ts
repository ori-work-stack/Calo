export interface NutritionStatistics {
  averageCaloriesDaily: number;
  calorieGoalAchievementPercent: number;
  averageProteinDaily: number;
  averageCarbsDaily: number;
  averageFatsDaily: number;
  averageFiberDaily: number;
  averageSodiumDaily: number;
  averageSugarDaily: number;
  averageFluidsDaily: number;
  processedFoodPercentage: number;
  alcoholCaffeineIntake: number;
  vegetableFruitIntake: number;
  fullLoggingPercentage: number;
  allergenAlerts: string[];
  healthRiskPercentage: number;
  averageEatingHours: { start: string; end: string };
  intermittentFastingHours: number;
  missedMealsAlert: number;
  nutritionScore: number;
  weeklyTrends: {
    calories: number[];
    protein: number[];
    carbs: number[];
    fats: number[];
  };
  insights: string[];
  recommendations: string[];
}
