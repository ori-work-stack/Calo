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
    .nullable()
    .transform((val) =>
      val && val !== ""
        ? typeof val === "string"
          ? parseFloat(val)
          : val
        : null
    ),
  body_fat_percentage: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) =>
      val && val !== ""
        ? typeof val === "string"
          ? parseFloat(val)
          : val
        : null
    ),
  additional_personal_info: z.array(z.string()).default([]),

  // Goals - main_goal is required
  main_goal: z.enum(
    [
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
    ],
    { required_error: "Main goal is required" }
  ),
  main_goal_text: z.array(z.string()).default([]),
  specific_goal: z.array(z.string()).default([]),
  goal_timeframe_days: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) =>
      val && val !== "" ? (typeof val === "string" ? parseInt(val) : val) : null
    ),
  commitment_level: z.string().min(1, "Commitment level is required"),
  most_important_outcome: z.array(z.string()).default([]),
  special_personal_goal: z.array(z.string()).default([]),

  // Physical activity - required fields
  physical_activity_level: z.enum(["NONE", "LIGHT", "MODERATE", "HIGH"], {
    required_error: "Physical activity level is required",
  }),
  sport_frequency: z.enum(
    ["NONE", "ONCE_A_WEEK", "TWO_TO_THREE", "FOUR_TO_FIVE", "MORE_THAN_FIVE"],
    { required_error: "Sport frequency is required" }
  ),
  sport_types: z.array(z.string()).default([]),
  sport_duration_min: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) =>
      val && val !== "" ? (typeof val === "string" ? parseInt(val) : val) : null
    ),
  workout_times: z.array(z.string()).default([]),
  uses_fitness_devices: z.boolean().default(false),
  fitness_device_type: z.array(z.string()).default([]),
  additional_activity_info: z.array(z.string()).default([]),

  // Health
  medical_conditions: z.array(z.string()).default([]),
  medical_conditions_text: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  health_goals: z.array(z.string()).default([]),
  functional_issues: z.array(z.string()).default([]),
  food_related_medical_issues: z.array(z.string()).default([]),

  // Means and conditions - required fields
  meals_per_day: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseInt(val) : val))
    .refine((val) => val >= 1 && val <= 10, {
      message: "Meals per day must be between 1 and 10",
    })
    .default(3),
  snacks_between_meals: z.boolean().default(false),
  meal_times: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(", ") : val))
    .default("8:00, 12:00, 18:00"),
  cooking_preference: z.string().min(1, "Cooking preference is required"),
  available_cooking_methods: z.array(z.string()).default([]),
  daily_food_budget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) =>
      val && val !== ""
        ? typeof val === "string"
          ? parseFloat(val)
          : val
        : null
    ),
  shopping_method: z.array(z.string()).default([]),
  daily_cooking_time: z.string().optional().nullable(),

  // Dietary preferences and restrictions - required fields
  kosher: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  allergies_text: z.array(z.string()).default([]),
  dietary_style: z.string().min(1, "Dietary style is required"),
  meal_texture_preference: z.array(z.string()).default([]),
  disliked_foods: z.array(z.string()).default([]),
  liked_foods: z.array(z.string()).default([]),
  regular_drinks: z.array(z.string()).default([]),
  intermittent_fasting: z.boolean().default(false),
  fasting_hours: z.string().optional().nullable(),

  // Additional
  past_diet_difficulties: z.array(z.string()).default([]),

  // Legacy fields from schema (for compatibility)
  program_duration: z.string().optional().nullable(),
  meal_timing_restrictions: z.string().optional().nullable(),
  dietary_restrictions: z.array(z.string()).optional().default([]),
  willingness_to_follow: z.boolean().optional().nullable(),
  upcoming_events: z.array(z.string()).optional().default([]),
  upload_frequency: z.string().optional().nullable(),
  notifications_preference: z
    .enum(["DAILY", "WEEKLY", "NONE"])
    .optional()
    .nullable(),
  personalized_tips: z.boolean().optional().nullable(),
  health_metrics_integration: z.boolean().optional().nullable(),
  family_medical_history: z.array(z.string()).optional().default([]),
  smoking_status: z.enum(["YES", "NO"]).optional().nullable(),
  sleep_hours_per_night: z.number().optional().nullable(),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;
