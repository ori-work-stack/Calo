import { z } from "zod";

export const questionnaireSchema = z.object({
  // Personal data
  age: z.number().min(1).max(120),
  gender: z.string().optional(),
  height_cm: z.number().positive().optional(),
  weight_kg: z.number().positive().optional(),
  target_weight_kg: z.number().positive().optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
  additional_personal_info: z.string().optional(),

  // Goals
  main_goal: z.enum([
    "WEIGHT_LOSS",
    "WEIGHT_MAINTENANCE",
    "WEIGHT_GAIN",
    "GENERAL_HEALTH",
    "MEDICAL_CONDITION",
    "SPORTS_PERFORMANCE",
    "ALERTNESS",
    "ENERGY",
    "SLEEP_QUALITY",
    "OTHER",
  ]),
  main_goal_text: z.string().optional(),
  specific_goal: z.string().optional(),
  goal_timeframe_days: z.number().positive().optional(),
  commitment_level: z.string().optional(),
  most_important_outcome: z.string().optional(),
  special_personal_goal: z.string().optional(),

  // Physical activity
  physical_activity_level: z.enum(["NONE", "LIGHT", "MODERATE", "HIGH"]),
  sport_frequency: z.enum([
    "NONE",
    "ONCE_A_WEEK",
    "TWO_TO_THREE",
    "FOUR_TO_FIVE",
    "MORE_THAN_FIVE",
  ]),
  sport_types: z.array(z.string()).optional(),
  sport_duration_min: z.number().positive().optional(),
  workout_times: z.string().optional(),
  uses_fitness_devices: z.boolean().optional(),
  fitness_device_type: z.string().optional(),
  additional_activity_info: z.string().optional(),

  // Health
  medical_conditions: z.array(z.string()).optional(),
  medical_conditions_text: z.string().optional(),
  medications: z.string().optional(),
  health_goals: z.string().optional(),
  functional_issues: z.string().optional(),
  food_related_medical_issues: z.string().optional(),

  // Means and conditions
  meals_per_day: z.number().min(1).max(10).optional(),
  snacks_between_meals: z.boolean().optional(),
  meal_times: z.string().optional(),
  cooking_preference: z.string().optional(),
  available_cooking_methods: z.array(z.string()).optional(),
  daily_food_budget: z.number().positive().optional(),
  shopping_method: z.string().optional(),
  daily_cooking_time: z.string().optional(),

  // Dietary preferences and restrictions
  kosher: z.boolean().optional(),
  allergies: z.array(z.string()).optional(),
  allergies_text: z.string().optional(),
  dietary_style: z.string().optional(),
  meal_texture_preference: z.string().optional(),
  disliked_foods: z.string().optional(),
  liked_foods: z.string().optional(),
  regular_drinks: z.array(z.string()).optional(),
  intermittent_fasting: z.boolean().optional(),
  fasting_hours: z.string().optional(),

  // Additional
  past_diet_difficulties: z.string().optional(),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;
