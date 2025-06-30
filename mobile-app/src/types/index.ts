import { z } from "zod";

//
// ✅ Zod Schemas
//
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().min(1, "username is required"),
  name: z.string(),
  age: z.number().min(1).max(120).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  goal: z.enum(["lose_weight", "maintain", "gain_weight"]).optional(),
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
// ✅ Manual Interfaces
//
export interface User {
  id: string;
  email: string;
  username: string;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  goal?: string;
  createdAt: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  createdAt: string;
  userId: string;
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
  imageUri: string;
  analysis: MealAnalysisData;
  timestamp: number;
}

export interface MealAnalysisData {
  description: string;
  items: Array<{
    name: string;
    quantity: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
    sugar?: string;
  }>;
  totalCalories: string;
  totalProtein: string;
  totalCarbs: string;
  totalFat: string;
  totalFiber?: string;
  totalSugar?: string;
  healthScore: string;
  recommendations: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}