import { z } from "zod";

//
// ✅ Zod Schemas
//
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string(),
  age: z.number().min(1).max(120),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const MealAnalysisSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
});

//
// ✅ Zod-Inferred Types
//
export type SignUpData = z.infer<typeof SignUpSchema>;
export type SignInData = z.infer<typeof SignInSchema>;
export type MealAnalysisData = z.infer<typeof MealAnalysisSchema>;

//
// ✅ Manual Interfaces - Updated to match Prisma schema
//
export interface User {
  user_id: string;
  email: string;
  name: string;
  age: number;
  weight_kg?: number;
  height_cm?: number;
  subscription_type: string;
  aiRequestsCount: number;
  aiRequestsResetAt: string;
  created_at: string;
}

// Updated Meal interface to match Prisma schema exactly
export interface Meal {
  meal_id: number; // This is the actual field name in Prisma
  id: string; // For compatibility with existing code
  user_id: string;
  image_url: string;
  upload_time: string;
  analysis_status: "PENDING" | "COMPLETED";
  meal_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  saturated_fats_g?: number | null;
  polyunsaturated_fats_g?: number | null;
  monounsaturated_fats_g?: number | null;
  omega_3_g?: number | null;
  omega_6_g?: number | null;
  fiber_g: number | null;
  soluble_fiber_g?: number | null;
  insoluble_fiber_g?: number | null;
  sugar_g: number | null;
  cholesterol_mg?: number | null;
  sodium_mg?: number | null;
  alcohol_g?: number | null;
  caffeine_mg?: number | null;
  liquids_ml?: number | null;
  serving_size_g?: number | null;
  allergens_json?: any;
  vitamins_json?: any;
  micronutrients_json?: any;
  glycemic_index?: number | null;
  insulin_index?: number | null;
  food_category?: string | null;
  processing_level?: string | null;
  cooking_method?: string | null;
  additives_json?: any;
  health_risk_notes?: string | null;
  created_at: string;

  // Computed fields for compatibility
  name: string;
  description?: string;
  imageUrl?: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  userId: string;

  // History features
  isFavorite?: boolean;
  tasteRating?: number;
  satietyRating?: number;
  energyRating?: number;
  heavinessRating?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface AIResponse {
  success: boolean;
  data?: MealAnalysisData;
  error?: string;
}

export interface PendingMeal {
  imageBase64: string;
  imageUri?: string;
  analysis: MealAnalysisData | null;
  timestamp: number;
  meal_id?: string; // For updates
}

// Daily stats interface
export interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  mealCount: number;
}
