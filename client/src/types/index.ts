import { z } from "zod";

//
// ✅ Zod Schemas
//
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string(),
  age: z.number().min(1).max(120).optional(),
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
// ✅ Manual Interfaces
//
export interface User {
  user_id: string;
  email: string;
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  subscription_type?: string;
  aiRequestsCount?: number;
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
  imageBase64: string;
  imageUri?: string;
  analysis: MealAnalysisData | null;
  timestamp: number;
  meal_id?: string; // For updates
}