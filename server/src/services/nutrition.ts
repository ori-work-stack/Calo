import { openAIService } from "./openai";
import { prisma } from "../lib/database";
import { MealAnalysisInput } from "../types/nutrition";
import { AuthService } from "./auth";

export class NutritionService {
  static async analyzeMeal(user_id: string, data: MealAnalysisInput) {
    const { imageBase64, language } = data;

    if (!imageBase64?.trim()) throw new Error("Image data is required");

    // Clean base64
    let cleanBase64 = imageBase64.trim();
    if (cleanBase64.startsWith("data:")) {
      const base64Index = cleanBase64.indexOf("base64,");
      if (base64Index !== -1) {
        cleanBase64 = cleanBase64.substring(base64Index + 7);
      }
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      throw new Error("Invalid base64 image format");
    }

    const user = await prisma.user.findUnique({
      where: { user_id: user_id },
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    const resetTime = new Date(user.aiRequestsResetAt);

    const needsReset =
      now.getDate() !== resetTime.getDate() ||
      now.getMonth() !== resetTime.getMonth() ||
      now.getFullYear() !== resetTime.getFullYear();

    if (needsReset) {
      await prisma.user.update({
        where: { user_id: user_id },
        data: { aiRequestsCount: 0, aiRequestsResetAt: now },
      });
      user.aiRequestsCount = 0;
    }

    const permissions = await AuthService.getRolePermissions(
      user.subscription_type
    );

    if (
      permissions.dailyRequests !== -1 &&
      user.aiRequestsCount >= permissions.dailyRequests
    ) {
      throw new Error("Daily AI request limit reached.");
    }

    try {
      const analysis = await openAIService.analyzeFood(cleanBase64, language);

      await prisma.user.update({
        where: { user_id: user_id },
        data: {
          aiRequestsCount: user.aiRequestsCount + 1,
        },
      });

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;

      for (const item of analysis.items || []) {
        totalCalories += parseFloat(item.calories) || 0;
        totalProtein += parseFloat(item.protein) || 0;
        totalCarbs += parseFloat(item.carbs) || 0;
        totalFat += parseFloat(item.fat) || 0;
        totalFiber += parseFloat(item.fiber || "0") || 0;
        totalSugar += parseFloat(item.sugar || "0") || 0;
      }

      const formattedAnalysis = {
        description: analysis.description || "Unknown meal",
        items: analysis.items || [],
        totalCalories: totalCalories.toString(),
        totalProtein: totalProtein.toString(),
        totalCarbs: totalCarbs.toString(),
        totalFat: totalFat.toString(),
        totalFiber: totalFiber.toString(),
        totalSugar: totalSugar.toString(),
        healthScore: analysis.healthScore?.toString() || "0",
        recommendations:
          analysis.recommendations || "No recommendations available",
        name: analysis.description || "Unknown meal",
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        fiber: totalFiber,
        sugar: totalSugar,
      };

      return {
        success: true,
        data: formattedAnalysis,
        remainingRequests:
          permissions.dailyRequests === -1
            ? -1
            : permissions.dailyRequests - (user.aiRequestsCount + 1),
      };
    } catch (error) {
      console.error("Error analyzing meal:", error);
      throw new Error(
        "Failed to analyze meal: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  static async saveMeal(user_id: string, mealData: any, imageBase64?: string) {
    try {
      const calories =
        typeof mealData.calories === "number"
          ? mealData.calories
          : parseFloat(mealData.totalCalories) || 0;
      const protein =
        typeof mealData.protein === "number"
          ? mealData.protein
          : parseFloat(mealData.totalProtein) || 0;
      const carbs =
        typeof mealData.carbs === "number"
          ? mealData.carbs
          : parseFloat(mealData.totalCarbs) || 0;
      const fat =
        typeof mealData.fat === "number"
          ? mealData.fat
          : parseFloat(mealData.totalFat) || 0;
      const fiber =
        typeof mealData.fiber === "number"
          ? mealData.fiber
          : parseFloat(mealData.totalFiber || "0") || 0;
      const sugar =
        typeof mealData.sugar === "number"
          ? mealData.sugar
          : parseFloat(mealData.totalSugar || "0") || 0;

      const meal = await prisma.meal.create({
        data: {
          user_id: user_id,
          meal_name: mealData.name || "Unknown meal",
          image_url: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : "",
          upload_time: new Date(),
          analysis_status: "COMPLETED", // or "PENDING" depending on logic
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fat,
          fiber_g: fiber,
          sugar_g: sugar,
        },
      });

      return meal;
    } catch (error) {
      console.error("Error saving meal:", error);
      throw new Error("Failed to save meal");
    }
  }

  static async getUserMeals(user_id: string) {
    try {
      const meals = await prisma.meal.findMany({
        where: { user_id: user_id },
        orderBy: { createdAt: "desc" },
      });

      return meals;
    } catch (error) {
      console.error("Error fetching meals:", error);
      throw new Error("Failed to fetch meals");
    }
  }

  static async getDailyStats(user_id: string, date: string) {
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const meals = await prisma.meal.findMany({
        where: {
          user_id: user_id,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      const stats = meals.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (meal.protein_g || 0),
          totalCarbs: acc.totalCarbs + (meal.carbs_g || 0),
          totalFat: acc.totalFat + (meal.fats_g || 0),
          totalFiber: acc.totalFiber + (meal.fiber_g || 0),
          totalSugar: acc.totalSugar + (meal.sugar_g || 0),
          totalMeals: acc.totalMeals + 1,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          totalMeals: 0,
        }
      );

      return { ...stats, meals };
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      throw new Error("Failed to fetch daily stats");
    }
  }
}
