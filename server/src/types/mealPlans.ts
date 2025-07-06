export interface MealPlanTemplate {
  template_id: string;
  name: string;
  description?: string | null;
  meal_timing: string;
  dietary_category: string;
  prep_time_minutes?: number | null;
  difficulty_level?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fats_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  ingredients: any[];
  instructions: any[];
  allergens: string[];
  image_url?: string | null;
}

export interface UserMealPlanConfig {
  name: string;
  plan_type: "WEEKLY" | "DAILY" | "THREE_DAYS";
  meals_per_day: number;
  snacks_per_day: number;
  rotation_frequency_days: number;
  include_leftovers: boolean;
  fixed_meal_times: boolean;
  dietary_preferences: string[];
  excluded_ingredients: string[];
}

export interface WeeklyMealPlan {
  [day: string]: {
    [mealTiming: string]: MealPlanTemplate[];
  };
}

// Interface for AI response structure
export interface AIMealPlanResponse {
  weekly_plan: {
    day: string;
    meals: {
      name: string;
      description?: string;
      meal_timing: string;
      dietary_category: string;
      prep_time_minutes?: number;
      difficulty_level?: number;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fats_g?: number;
      fiber_g?: number;
      sugar_g?: number;
      sodium_mg?: number;
      ingredients: any[];
      instructions: any[];
      allergens: string[];
      image_url?: string;
      portion_multiplier?: number;
      is_optional?: boolean;
    }[];
  }[];
}
