
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

      // Create meal in database using Prisma schema
      const meal = await prisma.meal.create({
        data: {
          userId,
          imageBase64,
          description: analysis.description,
          totalCalories: parseInt(analysis.totalCalories) || 0,
          totalProtein: parseFloat(analysis.totalProtein) || 0,
          totalCarbs: parseFloat(analysis.totalCarbs) || 0,
          totalFat: parseFloat(analysis.totalFat) || 0,
          totalFiber: parseFloat(analysis.totalFiber) || 0,
          totalSugar: parseFloat(analysis.totalSugar) || 0,
          healthScore: parseInt(analysis.healthScore) || 5,
          recommendations: analysis.recommendations,
          mealType: 'OTHER',
          consumedAt: date ? new Date(date) : now,
          foodItems: {
            create: analysis.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              calories: parseInt(item.calories) || 0,
              protein: parseFloat(item.protein) || 0,
              carbs: parseFloat(item.carbs) || 0,
              fat: parseFloat(item.fat) || 0,
              fiber: parseFloat(item.fiber) || 0,
              sugar: parseFloat(item.sugar) || 0,
            }))
          }
        },
        include: {
          foodItems: true
        }
      });

      // Update user AI request count
      await prisma.user.update({
        where: { id: userId },
        data: {
          aiRequestsCount: user.aiRequestsCount + 1,
        }
      });

      return {
        meal: {
          ...meal,
          aiResponse: analysis
        },
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
    const whereClause: any = { userId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.consumedAt = {
        gte: startDate,
        lt: endDate
      };
    }

    const meals = await prisma.meal.findMany({
      where: whereClause,
      include: {
        foodItems: true
      },
      orderBy: {
        consumedAt: 'desc'
      }
    });

    return meals;
  }

  static async getDailyStats(userId: string, date: string) {
    const meals = await this.getUserMeals(userId, date);
    
    const stats = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + meal.totalCalories,
      totalProtein: acc.totalProtein + meal.totalProtein,
      totalCarbs: acc.totalCarbs + meal.totalCarbs,
      totalFat: acc.totalFat + meal.totalFat,
      totalFiber: acc.totalFiber + (meal.totalFiber || 0),
      totalSugar: acc.totalSugar + (meal.totalSugar || 0),
      totalMeals: acc.totalMeals + 1,
      averageHealthScore: acc.averageHealthScore + meal.healthScore,
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalMeals: 0,
      averageHealthScore: 0,
    });

    if (stats.totalMeals > 0) {
      stats.averageHealthScore = stats.averageHealthScore / stats.totalMeals;
    }

    return { ...stats, meals };
  }
}
