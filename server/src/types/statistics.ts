export interface NutritionStatistics {
  average_calories_daily: number;
  calorie_goal_achievement_percent: number;
  average_protein_daily: number;
  average_carbs_daily: number;
  average_fats_daily: number;
  average_fiber_daily: number;
  average_sodium_daily: number;
  average_sugar_daily: number;
  average_fluids_daily: number;
  processed_food_percentage: number;
   alcohol_caffeine_intake: number;
  vegetable_fruit_intake: number;
  full_logging_percentage: number;
  allergen_alerts: string[];
  health_risk_percentage: number;
  average_eating_hours: { start: string; end: string };
  intermittent_fasting_hours: number;
  missed_meals_alert: number;
  nutrition_score: number;
  weekly_trends: {
    calories: number[];
    protein: number[];
    carbs: number[];
    fats: number[];
  };
  insights: string[];
  recommendations: string[];
}
