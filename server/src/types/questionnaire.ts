import { z } from "zod";

export const questionnaireSchema = z.object({
  // Personal data - all required in Prisma
  age: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val) : val))
    .refine((val) => val > 0 && val < 150, {
      message: "Age must be between 1 and 149",
    }),
  gender: z.string().min(1, "Gender is required"),
  height_cm: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0 && val < 300, {
      message: "Height must be between 1 and 299 cm",
    }),
  weight_kg: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0 && val < 1000, {
      message: "Weight must be between 1 and 999 kg",
    }),
  target_weight_kg: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseFloat(val) : val) : undefined
    ),
  body_fat_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseFloat(val) : val) : undefined
    ),
  additional_personal_info: z.array(z.string()).default([]),

  // Goals - main_goal is required enum
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
  main_goal_text: z.array(z.string()).default([]),
  specific_goal: z.array(z.string()).default([]),
  goal_timeframe_days: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseInt(val) : val) : undefined
    ),
  commitment_level: z.string(),
  most_important_outcome: z.array(z.string()).default([]),
  special_personal_goal: z.array(z.string()).default([]),

  // Physical activity - both are required enums
  physical_activity_level: z.enum(["NONE", "LIGHT", "MODERATE", "HIGH"]),
  sport_frequency: z.enum([
    "NONE",
    "ONCE_A_WEEK",
    "TWO_TO_THREE",
    "FOUR_TO_FIVE",
    "MORE_THAN_FIVE",
  ]),
  sport_types: z.array(z.string()).default([]),
  sport_duration_min: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseInt(val) : val) : undefined
    ),
  workout_times: z.array(z.string()).default([]),
  uses_fitness_devices: z.boolean().default(false),
  fitness_device_type: z.array(z.string()).default([]),
  additional_activity_info: z.array(z.string()).default([]),

  // Health
  medical_conditions: z.array(z.string()).default([]),
  medical_conditions_text: z.array(z.string()).default([]),
  medications: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),
  health_goals: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),
  functional_issues: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),
  food_related_medical_issues: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),

  // Means and conditions
  meals_per_day: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val) : val))
    .default(3),
  snacks_between_meals: z.boolean().default(false),
  meal_times: z.string().optional(), // String in Prisma, not array
  cooking_preference: z.string(),
  available_cooking_methods: z.array(z.string()).default([]),
  daily_food_budget: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseFloat(val) : val) : undefined
    ),
  shopping_method: z.array(z.string()).default([]),
  daily_cooking_time: z.string().optional(),

  // Dietary preferences and restrictions
  kosher: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  allergies_text: z.array(z.string()).default([]),
  dietary_style: z.string(),
  meal_texture_preference: z.array(z.string()).default([]),
  disliked_foods: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),
  liked_foods: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => (typeof val === "string" ? [val] : val))
    .default([]),
  regular_drinks: z.array(z.string()).default([]),
  intermittent_fasting: z.boolean().optional(),
  fasting_hours: z.string().optional().nullable(),

  // Additional
  past_diet_difficulties: z.array(z.string()).default([]),

  // Legacy fields for compatibility
  program_duration: z.string().optional(),
  meal_timing_restrictions: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(", ") : val))
    .optional(),
  dietary_restrictions: z.array(z.string()).default([]),
  willingness_to_follow: z.boolean().optional(),
  upcoming_events: z.array(z.string()).default([]),
  upload_frequency: z.string().optional(),
  notifications_preference: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(", ") : val))
    .optional(),
  personalized_tips: z.boolean().optional(),
  health_metrics_integration: z.boolean().optional(),
  family_medical_history: z.array(z.string()).default([]),
  smoking_status: z.string().optional(),
  sleep_hours_per_night: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) =>
      val ? (typeof val === "string" ? parseFloat(val) : val) : undefined
    ),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;
