import { z } from 'zod';

export const mealAnalysisSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
  language: z.enum(['english', 'hebrew']).default('english'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  updateText: z.string().optional(), // For meal updates
});

export const mealUpdateSchema = z.object({
  meal_id: z.string(),
  updateText: z.string().min(1, 'Update text is required'),
  language: z.enum(['english', 'hebrew']).default('english'),
});

export const mealSchema = z.object({
  meal_id: z.string(),
  user_id: z.string(),
  image_url: z.string(),
  meal_name: z.string().nullable(),
  calories: z.number().nullable(),
  protein_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fats_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  sugar_g: z.number().nullable(),
  analysis_status: z.enum(['PENDING', 'COMPLETED']),
  upload_time: z.date(),
  createdAt: z.date(),
});

export type MealAnalysisInput = z.infer<typeof mealAnalysisSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
export type Meal = z.infer<typeof mealSchema>;