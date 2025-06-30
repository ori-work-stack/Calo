import { PrismaClient } from '@prisma/client';
import { openai } from './openai';
import { MealAnalysisData, AIResponse } from '../types/nutrition';

const prisma = new PrismaClient();

export class NutritionService {
  static async analyzeMealImage(imageBase64: string): Promise<AIResponse> {
    try {
      console.log('Analyzing meal image with OpenAI...');

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and provide detailed nutritional information. Return a JSON object with the following structure:
                {
                  "name": "Food name",
                  "description": "Brief description",
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number,
                  "fiber": number,
                  "sugar": number,
                  "sodium": number
                }
                All nutritional values should be in grams except calories (kcal) and sodium (mg).`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const analysisData = JSON.parse(content);

      return {
        success: true,
        data: analysisData
      };
    } catch (error) {
      console.error('Error analyzing meal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze meal'
      };
    }
  }

  static async saveMeal(userId: string, mealData: MealAnalysisData, imageUrl?: string) {
    try {
      const meal = await prisma.meal.create({
        data: {
          userId,
          name: mealData.name,
          description: mealData.description,
          imageUrl,
          calories: mealData.calories,
          protein: mealData.protein,
          carbs: mealData.carbs,
          fat: mealData.fat,
          fiber: mealData.fiber || 0,
          sugar: mealData.sugar || 0,
          sodium: mealData.sodium || 0,
        },
      });

      return meal;
    } catch (error) {
      console.error('Error saving meal:', error);
      throw new Error('Failed to save meal');
    }
  }

  static async getUserMeals(userId: string, limit?: number) {
    try {
      const meals = await prisma.meal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return meals;
    } catch (error) {
      console.error('Error fetching user meals:', error);
      throw new Error('Failed to fetch meals');
    }
  }

  static async getDailyStats(userId: string, date: Date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get user's meals for today
  const meals = await prisma.meal.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

      const stats = meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat,
          fiber: acc.fiber + (meal.fiber || 0),
          sugar: acc.sugar + (meal.sugar || 0),
          sodium: acc.sodium + (meal.sodium || 0),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        }
      );

      return {
        date: date.toISOString().split('T')[0],
        mealCount: meals.length,
        ...stats,
      };
    } catch (error) {
      console.error('Error calculating daily stats:', error);
      throw new Error('Failed to calculate daily stats');
    }
  }
}