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

  static async updateMeal(
    user_id: string,
    updateData: {
      meal_id: string;
      updateText: string;
      language?: string;
    }
  ) {
    try {
      console.log("🔄 Updating meal with AI enhancement...");

      // Get existing meal
      const existingMeal = await prisma.meal.findFirst({
        where: {
          meal_id: Number(updateData.meal_id),
          user_id,
        },
      });

      if (!existingMeal) {
        throw new Error("Meal not found");
      }

      // Preserve all existing data and create complete analysis object
      const originalAnalysis = {
        name: existingMeal.meal_name ?? "Untitled Meal",
        calories: Number(existingMeal.calories) || 0,
        protein: Number(existingMeal.protein_g) || 0,
        carbs: Number(existingMeal.carbs_g) || 0,
        fat: Number(existingMeal.fats_g) || 0,
        fiber: Number(existingMeal.fiber_g) || 0,
        sugar: Number(existingMeal.sugar_g) || 0,
        sodium: Number(existingMeal.sodium_mg) || 0,
        ingredients: Array.isArray(existingMeal.ingredients)
          ? existingMeal.ingredients
          : [],
        servingSize: existingMeal.serving_size_g || "1 serving",
        cookingMethod: existingMeal.cooking_method || "Unknown",
        healthNotes: existingMeal.health_risk_notes || "",
        confidence: Number(existingMeal.confidence) || 1.0,
        saturated_fats_g: Number(existingMeal.saturated_fats_g) || undefined,
        polyunsaturated_fats_g:
          Number(existingMeal.polyunsaturated_fats_g) || undefined,
        monounsaturated_fats_g:
          Number(existingMeal.monounsaturated_fats_g) || undefined,
        omega_3_g: Number(existingMeal.omega_3_g) || undefined,
        omega_6_g: Number(existingMeal.omega_6_g) || undefined,
        soluble_fiber_g: Number(existingMeal.soluble_fiber_g) || undefined,
        insoluble_fiber_g: Number(existingMeal.insoluble_fiber_g) || undefined,
        cholesterol_mg: Number(existingMeal.cholesterol_mg) || undefined,
        alcohol_g: Number(existingMeal.alcohol_g) || undefined,
        caffeine_mg: Number(existingMeal.caffeine_mg) || undefined,
        liquids_ml: Number(existingMeal.liquids_ml) || undefined,
        serving_size_g: Number(existingMeal.serving_size_g) || undefined,
        allergens_json: existingMeal.allergens_json || "",
        vitamins_json: existingMeal.vitamins_json || "",
        micronutrients_json: existingMeal.micronutrients_json || "",
        glycemic_index: Number(existingMeal.glycemic_index) || undefined,
        insulin_index: Number(existingMeal.insulin_index) || undefined,
        food_category: existingMeal.food_category || "",
        processing_level: existingMeal.processing_level || "",
        cooking_method: existingMeal.cooking_method || "",
        additives_json: existingMeal.additives_json || "",
        health_risk_notes: existingMeal.health_risk_notes || undefined,
      };

      const updatedAnalysis = await OpenAIService.updateMealAnalysis(
        originalAnalysis,
        updateData.updateText,
        updateData.language || "english"
      );

      // Update meal in database - preserve all existing fields that aren't updated
      const updatedMeal = await prisma.meal.update({
        where: {
          meal_id: Number(updateData.meal_id),
        },
        data: {
          // Core fields that can be updated
          meal_name: updatedAnalysis.name,
          calories: updatedAnalysis.calories,
          protein_g: updatedAnalysis.protein,
          carbs_g: updatedAnalysis.carbs,
          fats_g: updatedAnalysis.fat,
          fiber_g: updatedAnalysis.fiber ?? existingMeal.fiber_g,
          sugar_g: updatedAnalysis.sugar ?? existingMeal.sugar_g,
          sodium_mg: updatedAnalysis.sodium ?? existingMeal.sodium_mg,
          confidence: updatedAnalysis.confidence,
          ingredients: updatedAnalysis.ingredients,

          // Preserve detailed nutrition fields if not provided in update
          saturated_fats_g:
            updatedAnalysis.saturated_fats_g ?? existingMeal.saturated_fats_g,
          polyunsaturated_fats_g:
            updatedAnalysis.polyunsaturated_fats_g ??
            existingMeal.polyunsaturated_fats_g,
          monounsaturated_fats_g:
            updatedAnalysis.monounsaturated_fats_g ??
            existingMeal.monounsaturated_fats_g,
          omega_3_g: updatedAnalysis.omega_3_g ?? existingMeal.omega_3_g,
          omega_6_g: updatedAnalysis.omega_6_g ?? existingMeal.omega_6_g,
          soluble_fiber_g:
            updatedAnalysis.soluble_fiber_g ?? existingMeal.soluble_fiber_g,
          insoluble_fiber_g:
            updatedAnalysis.insoluble_fiber_g ?? existingMeal.insoluble_fiber_g,
          cholesterol_mg:
            updatedAnalysis.cholesterol_mg ?? existingMeal.cholesterol_mg,
          alcohol_g: updatedAnalysis.alcohol_g ?? existingMeal.alcohol_g,
          caffeine_mg: updatedAnalysis.caffeine_mg ?? existingMeal.caffeine_mg,
          liquids_ml: updatedAnalysis.liquids_ml ?? existingMeal.liquids_ml,
          serving_size_g:
            updatedAnalysis.serving_size_g ?? existingMeal.serving_size_g,
          allergens_json:
            updatedAnalysis.allergens_json ?? existingMeal.allergens_json,
          vitamins_json:
            updatedAnalysis.vitamins_json ?? existingMeal.vitamins_json,
          micronutrients_json:
            updatedAnalysis.micronutrients_json ??
            existingMeal.micronutrients_json,
          glycemic_index:
            updatedAnalysis.glycemic_index ?? existingMeal.glycemic_index,
          insulin_index:
            updatedAnalysis.insulin_index ?? existingMeal.insulin_index,
          food_category:
            updatedAnalysis.food_category ?? existingMeal.food_category,
          processing_level:
            updatedAnalysis.processing_level ?? existingMeal.processing_level,
          cooking_method:
            updatedAnalysis.cooking_method ?? existingMeal.cooking_method,
          additives_json:
            updatedAnalysis.additives_json ?? existingMeal.additives_json,
          health_risk_notes:
            updatedAnalysis.health_risk_notes ?? existingMeal.health_risk_notes,

          // System fields
          updated_at: new Date(),
        },
      });

      console.log("✅ Meal updated successfully");
      return updatedMeal;
    } catch (error) {
      console.error("💥 Error updating meal:", error);
      throw error;
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
  // Add this method to your NutritionService class

  // Add this method to your NutritionService class

  static async getRangeStatistics(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      console.log("📊 Getting range statistics for user:", userId);
      console.log("📅 Date range:", { startDate, endDate });

      // Convert date strings to DateTime objects for proper comparison
      const startDateTime = new Date(startDate + "T00:00:00.000Z");
      const endDateTime = new Date(endDate + "T23:59:59.999Z");

      // Query meals within the date range using created_at
      const meals = await prisma.meal.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        orderBy: {
          created_at: "asc",
        },
      });

      if (meals.length === 0) {
        return {
          totalDays: 0,
          totalMeals: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFats: 0,
          dailyBreakdown: [],
        };
      }

      // Calculate total statistics
      const totalMeals = meals.length;
      const totalCalories = meals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0
      );
      const totalProtein = meals.reduce(
        (sum, meal) => sum + (meal.protein_g || 0),
        0
      );
      const totalCarbs = meals.reduce(
        (sum, meal) => sum + (meal.carbs_g || 0),
        0
      );
      const totalFats = meals.reduce(
        (sum, meal) => sum + (meal.fats_g || 0),
        0
      );

      // Group meals by date for daily breakdown (using created_at)
      const dailyData = meals.reduce((acc, meal) => {
        const date = meal.created_at.toISOString().split("T")[0]; // Extract YYYY-MM-DD
        if (!acc[date]) {
          acc[date] = {
            date,
            meals: [],
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFats: 0,
            mealCount: 0,
          };
        }

        acc[date].meals.push({
          meal_id: meal.meal_id,
          meal_name: meal.meal_name,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fats_g: meal.fats_g,
          created_at: meal.created_at,
        });
        acc[date].totalCalories += meal.calories || 0;
        acc[date].totalProtein += meal.protein_g || 0;
        acc[date].totalCarbs += meal.carbs_g || 0;
        acc[date].totalFats += meal.fats_g || 0;
        acc[date].mealCount += 1;

        return acc;
      }, {} as Record<string, any>);

      const dailyBreakdown = Object.values(dailyData);
      const totalDays = dailyBreakdown.length;

      // Calculate averages per day
      const averageCalories = totalDays > 0 ? totalCalories / totalDays : 0;
      const averageProtein = totalDays > 0 ? totalProtein / totalDays : 0;
      const averageCarbs = totalDays > 0 ? totalCarbs / totalDays : 0;
      const averageFats = totalDays > 0 ? totalFats / totalDays : 0;

      const statistics = {
        totalDays,
        totalMeals,
        totalCalories: Math.round(totalCalories * 100) / 100,
        averageCalories: Math.round(averageCalories * 100) / 100,
        averageProtein: Math.round(averageProtein * 100) / 100,
        averageCarbs: Math.round(averageCarbs * 100) / 100,
        averageFats: Math.round(averageFats * 100) / 100,
        dailyBreakdown: dailyBreakdown.sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        dateRange: {
          startDate,
          endDate,
        },
      };

      console.log("✅ Range statistics calculated successfully");
      return statistics;
    } catch (error) {
      console.error("💥 Error getting range statistics:", error);
      throw error;
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
