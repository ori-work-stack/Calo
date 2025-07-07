import { OpenAIService } from "./openai";
import { prisma } from "../lib/database";
import { MealAnalysisInput, MealUpdateInput } from "../types/nutrition";
import { AuthService } from "./auth";
import {
  asJsonObject,
  mapExistingMealToPrismaInput,
  mapMealDataToPrismaFields,
} from "../utils/nutrition";

function transformMealForClient(meal: any) {
  const additives = meal.additives_json || {};
  const feedback = additives.feedback || {};
  return {
    meal_id: meal.meal_id,
    user_id: meal.user_id,
    image_url: meal.image_url,
    upload_time: meal.upload_time,
    analysis_status: meal.analysis_status,
    meal_name: meal.meal_name,
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fats_g: meal.fats_g,
    fiber_g: meal.fiber_g,
    sugar_g: meal.sugar_g,
    created_at: meal.created_at,
    id: meal.meal_id.toString(),
    name: meal.meal_name || "Unknown Meal",
    description: meal.meal_name,
    imageUrl: meal.image_url,
    protein: meal.protein_g || 0,
    carbs: meal.carbs_g || 0,
    fat: meal.fats_g || 0,
    fiber: meal.fiber_g || 0,
    sugar: meal.sugar_g || 0,
    userId: meal.user_id,
    isFavorite: additives.isFavorite || false,
    tasteRating: feedback.tasteRating || 0,
    satietyRating: feedback.satietyRating || 0,
    energyRating: feedback.energyRating || 0,
    heavinessRating: feedback.heavinessRating || 0,
  };
}

async function checkDailyLimit(user: any) {
  const now = new Date();
  const resetTime = new Date(user.ai_requests_reset_at);
  const needsReset =
    now.getDate() !== resetTime.getDate() ||
    now.getMonth() !== resetTime.getMonth() ||
    now.getFullYear() !== resetTime.getFullYear();

  if (needsReset) {
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { ai_requests_count: 0, ai_requests_reset_at: now },
    });
    user.ai_requests_count = 0;
  }

  const permissions = await AuthService.getRolePermissions(
    user.subscription_type
  );
  if (
    permissions.dailyRequests !== -1 &&
    user.ai_requests_count >= permissions.dailyRequests
  ) {
    throw new Error("Daily AI request limit reached.");
  }
  return permissions;
}

export class NutritionService {
  static async analyzeMeal(user_id: string, data: MealAnalysisInput) {
    const { imageBase64, language } = data;
    if (!imageBase64?.trim()) throw new Error("Image data is required");

    let cleanBase64 = imageBase64.trim().replace(/^data:.*base64,/, "");
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64))
      throw new Error("Invalid base64 image format");

    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) throw new Error("User not found");

    const permissions = await checkDailyLimit(user);

    try {
      const analysis = await OpenAIService.analyzeMealImage(
        cleanBase64,
        language
      );
      await prisma.user.update({
        where: { user_id },
        data: { ai_requests_count: user.ai_requests_count + 1 },
      });

      const items = (analysis.ingredients || []).map((ingredient, index) => ({
        id: index,
        name:
          typeof ingredient === "string"
            ? ingredient
            : ingredient.name || `Item ${index + 1}`,
        calories: (ingredient.calories || 0).toString(),
        protein: (ingredient.protein || 0).toString(),
        carbs: (ingredient.carbs || 0).toString(),
        fat: (ingredient.fat || 0).toString(),
        fiber: Number(ingredient.fiber ?? 0),
        sugar: Number(ingredient.sugar ?? 0),
      }));

      const mappedMeal = mapMealDataToPrismaFields(
        analysis,
        user_id,
        cleanBase64
      );
      return {
        success: true,
        data: {
          ...mappedMeal,
          items,
          healthScore: (analysis.confidence * 100).toString() || "0",
          recommendations:
            analysis.healthNotes || "No recommendations available",
        },
        remainingRequests:
          permissions.dailyRequests === -1
            ? -1
            : permissions.dailyRequests - (user.ai_requests_count + 1),
      };
    } catch (error) {
      throw new Error(
        "Failed to analyze meal: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  static async updateMeal(user_id: string, data: MealUpdateInput) {
    const { meal_id, updateText, language } = data;

    const meal = await prisma.meal.findFirst({
      where: { meal_id: parseInt(meal_id), user_id },
    });
    if (!meal) throw new Error("Meal not found");

    const user = await prisma.user.findUnique({ where: { user_id } });
    if (!user) throw new Error("User not found");

    await checkDailyLimit(user);

    try {
      const imageBase64 = meal.image_url.replace(/^data:.*base64,/, "");
      const updatedAnalysis = await OpenAIService.analyzeMealImage(
        imageBase64,
        language,
        updateText
      );

      await prisma.user.update({
        where: { user_id },
        data: { ai_requests_count: user.ai_requests_count + 1 },
      });

      const ingredients = updatedAnalysis.ingredients || [];
      const totals = ingredients.reduce(
        (acc, item) => {
          acc.calories += Number(item.calories) || 0;
          acc.protein += Number(item.protein) || 0;
          acc.carbs += Number(item.carbs) || 0;
          acc.fat += Number(item.fat) || 0;
          acc.fiber += Number(item.fiber ?? 0) || 0;
          acc.sugar += Number(item.sugar ?? 0) || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
      );

      const updatedMeal = await prisma.meal.update({
        where: { meal_id: meal.meal_id },
        data: {
          meal_name: updatedAnalysis.description || meal.meal_name,
          calories: totals.calories,
          protein_g: totals.protein,
          carbs_g: totals.carbs,
          fats_g: totals.fat,
          fiber_g: totals.fiber,
          sugar_g: totals.sugar,
        },
      });

      return transformMealForClient(updatedMeal);
    } catch (error) {
      throw new Error(
        "Failed to update meal: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  static async saveMeal(user_id: string, mealData: any, imageBase64?: string) {
    try {
      const meal = await prisma.meal.create({
        data: mapMealDataToPrismaFields(mealData, user_id, imageBase64),
      });
      return transformMealForClient(meal);
    } catch (error) {
      throw new Error("Failed to save meal");
    }
  }

  static async getUserMeals(user_id: string) {
    try {
      const meals = await prisma.meal.findMany({
        where: { user_id },
        orderBy: { created_at: "desc" },
      });
      return meals.map(transformMealForClient);
    } catch (error) {
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
          user_id,
          created_at: { gte: startDate, lt: endDate },
        },
      });

      return meals.reduce(
        (acc, meal) => {
          acc.calories += meal.calories || 0;
          acc.protein += meal.protein_g || 0;
          acc.carbs += meal.carbs_g || 0;
          acc.fat += meal.fats_g || 0;
          acc.fiber += meal.fiber_g || 0;
          acc.sugar += meal.sugar_g || 0;
          acc.meal_count++;
          return acc;
        },
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          meal_count: 0,
        }
      );
    } catch (error) {
      throw new Error("Failed to fetch daily stats");
    }
  }

  static async saveMealFeedback(
    user_id: string,
    meal_id: string,
    feedback: any
  ) {
    const meal = await prisma.meal.findFirst({
      where: { meal_id: parseInt(meal_id), user_id },
    });
    if (!meal) throw new Error("Meal not found");

    const additives = asJsonObject(meal.additives_json);
    const existingFeedback = asJsonObject(additives.feedback);

    const updatedAdditives = {
      ...additives,
      feedback: {
        ...existingFeedback,
        ...feedback,
        updatedAt: new Date().toISOString(),
      },
    };

    await prisma.meal.update({
      where: { meal_id: meal.meal_id },
      data: { additives_json: updatedAdditives },
    });

    return { meal_id, feedback };
  }

  static async toggleMealFavorite(user_id: string, meal_id: string) {
    const meal = await prisma.meal.findFirst({
      where: { meal_id: parseInt(meal_id), user_id },
    });
    if (!meal) throw new Error("Meal not found");

    const additives = asJsonObject(meal.additives_json);
    const current = Boolean(additives.isFavorite);

    const updatedAdditives = {
      ...additives,
      isFavorite: !current,
      favoriteUpdatedAt: new Date().toISOString(),
    };

    await prisma.meal.update({
      where: { meal_id: meal.meal_id },
      data: { additives_json: updatedAdditives },
    });

    return { meal_id, isFavorite: !current };
  }

  static async duplicateMeal(
    user_id: string,
    meal_id: string,
    newDate?: string
  ) {
    const originalMeal = await prisma.meal.findFirst({
      where: { meal_id: parseInt(meal_id), user_id },
    });
    if (!originalMeal) throw new Error("Meal not found");

    const duplicateDate = newDate ? new Date(newDate) : new Date();
    const duplicatedMeal = await prisma.meal.create({
      data: mapExistingMealToPrismaInput(originalMeal, user_id, duplicateDate),
    });

    return transformMealForClient(duplicatedMeal);
  }
}
