import { z } from 'zod';

export const mealAnalysisSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
  language: z.enum(['english', 'hebrew']).default('english'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const mealSchema = z.object({
  id: z.string(),
  image: z.string(),
  aiResponse: z.object({
    description: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.string(),
      calories: z.string(),
      protein: z.string(),
      carbs: z.string(),
      fat: z.string(),
      fiber: z.string().optional(),
      sugar: z.string().optional(),
    })),
    totalCalories: z.string(),
    totalProtein: z.string(),
    totalCarbs: z.string(),
    totalFat: z.string(),
    healthScore: z.string(),
    recommendations: z.string(),
  }),
  calories: z.number(),
  timestamp: z.date(),
});

export type MealAnalysisInput = z.infer<typeof mealAnalysisSchema>;
export type Meal = z.infer<typeof mealSchema>;