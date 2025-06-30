
import { z } from 'zod';

// Zod schemas
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(1).max(120).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal: z.enum(['lose_weight', 'maintain', 'gain_weight']).optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
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

// TypeScript types
export type SignUpData = z.infer<typeof SignUpSchema>;
export type SignInData = z.infer<typeof SignInSchema>;
export type MealAnalysisData = z.infer<typeof MealAnalysisSchema>;

export interface User {
  id: string;
  email: string;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  activityLevel?: string;
  goal?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
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
