import { openAIService } from './openai';
import { prisma } from '../lib/database';
import { MealAnalysisInput } from '../types/nutrition';
import { AuthService } from './auth';

export class NutritionService {
  static async analyzeMeal(userId: string, data: MealAnalysisInput) {
    const { imageBase64, language, date } = data;

    // Get user and check AI request limits
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if daily limit needs reset
    const now = new Date();
    const resetTime = new Date(user.aiRequestsResetAt);
    
    if (now.getDate() !== resetTime.getDate() || 
        now.getMonth() !== resetTime.getMonth() || 
        now.getFullYear() !== resetTime.getFullYear()) {
      // Reset daily count
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiRequestsCount: 0,
          aiRequestsResetAt: now,
        }
      });
      user.aiRequestsCount = 0;
    }

    // Check role permissions
    const permissions = await AuthService.getRolePermissions(user.role);
    
    if (permissions.dailyRequests !== -1 && user.aiRequestsCount >= permissions.dailyRequests) {
      throw new Error(`Daily AI request limit reached. Upgrade your plan to analyze more meals.`);
    }

    try {
      // Analyze food with OpenAI
      const analysis = await openAIService.analyzeFood(imageBase64, language);

      // Create meal object - store image as base64 in database
      const mealId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const meal = {
        id: mealId,
        image: imageBase64, // Store base64 directly in database
        aiResponse: analysis,
        calories: parseInt(analysis.totalCalories) || 0,
        timestamp: new Date(),
      };

      // Get current meals data
      const currentMeals = user.meals as Record<string, any[]> || {};
      const mealDate = date || now.toISOString().split('T')[0];
      
      if (!currentMeals[mealDate]) {
        currentMeals[mealDate] = [];
      }
      
      currentMeals[mealDate].push(meal);

      // Update user with new meal and increment AI request count
      await prisma.user.update({
        where: { id: userId },
        data: {
          meals: currentMeals,
          aiRequestsCount: user.aiRequestsCount + 1,
        }
      });

      return {
        meal,
        remainingRequests: permissions.dailyRequests === -1 
          ? -1 
          : permissions.dailyRequests - (user.aiRequestsCount + 1)
      };
    } catch (error) {
      console.error('Error analyzing meal:', error);
      throw new Error('Failed to analyze meal');
    }
  }

  static async getUserMeals(userId: string, date?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { meals: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const meals = user.meals as Record<string, any[]> || {};
    
    if (date) {
      return meals[date] || [];
    }

    return meals;
  }

  static async getDailyStats(userId: string, date: string) {
    const meals = await this.getUserMeals(userId, date);
    
    const stats = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + meal.calories,
      totalMeals: acc.totalMeals + 1,
      averageHealthScore: acc.averageHealthScore + parseInt(meal.aiResponse.healthScore),
    }), {
      totalCalories: 0,
      totalMeals: 0,
      averageHealthScore: 0,
    });

    if (stats.totalMeals > 0) {
      stats.averageHealthScore = stats.averageHealthScore / stats.totalMeals;
    }

    return { ...stats, meals };
  }
}