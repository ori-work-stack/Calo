import { OpenAIService } from "./openai";
import { prisma } from "../lib/database";
import { MealAnalysisInput, MealUpdateInput } from "../types/nutrition";
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

    console.log("🔍 Finding user:", user_id);
    const user = await prisma.user.findUnique({
      where: { user_id: user_id },
    });

    if (!user) {
      console.error("❌ User not found:", user_id);
      throw new Error("User not found");
    }

    console.log("✅ User found:", user.email);

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
      const analysis = await OpenAIService.analyzeMealImage(
        cleanBase64,
        language
      );

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

  static async updateMeal(user_id: string, data: MealUpdateInput) {
    const { meal_id, updateText, language } = data;

    console.log("🔄 Starting meal update process...");
    console.log("🆔 Meal ID:", meal_id);
    console.log("📝 Update text:", updateText);
    console.log("👤 User ID:", user_id);

    // Find the meal
    const meal = await prisma.meal.findFirst({
      where: {
        meal_id: parseInt(meal_id),
        user_id: user_id,
      },
    });

    if (!meal) {
      console.error("❌ Meal not found for user:", user_id, "meal:", meal_id);
      throw new Error("Meal not found");
    }

    console.log("✅ Found meal:", meal.meal_name);

    // Check if user has AI requests available
    const user = await prisma.user.findUnique({
      where: { user_id: user_id },
    });

    if (!user) throw new Error("User not found");

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
      // Get the original image for re-analysis
      let imageBase64 = meal.image_url;

      // Extract base64 from data URL if needed
      if (imageBase64.startsWith("data:")) {
        const base64Index = imageBase64.indexOf("base64,");
        if (base64Index !== -1) {
          imageBase64 = imageBase64.substring(base64Index + 7);
        }
      }

      console.log("🔍 Re-analyzing meal with update text...");

      // Re-analyze the meal with the update text
      const updatedAnalysis = await OpenAIService.analyzeMealImage(
        imageBase64,
        language,
        updateText
      );

      console.log("✅ Updated analysis received");

      // Update AI request count
      await prisma.user.update({
        where: { user_id: user_id },
        data: {
          aiRequestsCount: user.aiRequestsCount + 1,
        },
      });

      // Calculate totals from updated analysis
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;

      for (const item of updatedAnalysis.items || []) {
        totalCalories += parseFloat(item.calories) || 0;
        totalProtein += parseFloat(item.protein) || 0;
        totalCarbs += parseFloat(item.carbs) || 0;
        totalFat += parseFloat(item.fat) || 0;
        totalFiber += parseFloat(item.fiber || "0") || 0;
        totalSugar += parseFloat(item.sugar || "0") || 0;
      }

      // Update the meal in the database
      const updatedMeal = await prisma.meal.update({
        where: { meal_id: meal.meal_id },
        data: {
          meal_name: updatedAnalysis.description || meal.meal_name,
          calories: totalCalories,
          protein_g: totalProtein,
          carbs_g: totalCarbs,
          fats_g: totalFat,
          fiber_g: totalFiber,
          sugar_g: totalSugar,
        },
      });

      console.log("✅ Meal updated in database");

      // Transform the meal data to match client expectations
      const transformedMeal = {
        // Server fields
        meal_id: updatedMeal.meal_id,
        user_id: updatedMeal.user_id,
        image_url: updatedMeal.image_url,
        upload_time: updatedMeal.upload_time,
        analysis_status: updatedMeal.analysis_status,
        meal_name: updatedMeal.meal_name,
        calories: updatedMeal.calories,
        protein_g: updatedMeal.protein_g,
        carbs_g: updatedMeal.carbs_g,
        fats_g: updatedMeal.fats_g,
        fiber_g: updatedMeal.fiber_g,
        sugar_g: updatedMeal.sugar_g,
        createdAt: updatedMeal.createdAt,

        // Computed fields for compatibility
        id: updatedMeal.meal_id.toString(),
        name: updatedMeal.meal_name || "Unknown Meal",
        description: updatedMeal.meal_name,
        imageUrl: updatedMeal.image_url,
        protein: updatedMeal.protein_g || 0,
        carbs: updatedMeal.carbs_g || 0,
        fat: updatedMeal.fats_g || 0,
        fiber: updatedMeal.fiber_g || 0,
        sugar: updatedMeal.sugar_g || 0,
        userId: updatedMeal.user_id,
      };

      return transformedMeal;
    } catch (error) {
      console.error("💥 Error updating meal:", error);
      throw new Error(
        "Failed to update meal: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  static async saveMeal(user_id: string, mealData: any, imageBase64?: string) {
    try {
      console.log("💾 Saving meal for user:", user_id);

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
          analysis_status: "COMPLETED",
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fats_g: fat,
          fiber_g: fiber,
          sugar_g: sugar,
        },
      });

      console.log("✅ Meal saved with ID:", meal.meal_id);

      // Transform the meal data to match client expectations
      const transformedMeal = {
        // Server fields
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
        createdAt: meal.createdAt,

        // Computed fields for compatibility
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
      };

      return transformedMeal;
    } catch (error) {
      console.error("Error saving meal:", error);
      throw new Error("Failed to save meal");
    }
  }

  static async getUserMeals(user_id: string) {
    try {
      console.log("📥 Fetching meals for user:", user_id);

      const meals = await prisma.meal.findMany({
        where: { user_id: user_id },
        orderBy: { createdAt: "desc" },
      });

      console.log("✅ Found", meals.length, "meals for user");

      // Transform meals to match client expectations
      const transformedMeals = meals.map((meal) => {
        // Parse additives_json to get feedback and favorite status
        const additives = (meal.additives_json as any) || {};
        const feedback = additives.feedback || {};
        const isFavorite = additives.isFavorite || false;

        return {
          // Server fields
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
          createdAt: meal.createdAt,

          // Computed fields for compatibility
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

          // History features
          isFavorite,
          tasteRating: feedback.tasteRating || 0,
          satietyRating: feedback.satietyRating || 0,
          energyRating: feedback.energyRating || 0,
          heavinessRating: feedback.heavinessRating || 0,
        };
      });

      return transformedMeals;
    } catch (error) {
      console.error("Error fetching meals:", error);
      throw new Error("Failed to fetch meals");
    }
  }

  static async getDailyStats(user_id: string, date: string) {
    try {
      console.log("📊 Fetching daily stats for user:", user_id, "date:", date);

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

      console.log("✅ Found", meals.length, "meals for date");

      const stats = meals.reduce(
        (
          acc: {
            calories: any;
            protein: any;
            carbs: any;
            fat: any;
            fiber: any;
            sugar: any;
            mealCount: number;
          },
          meal: {
            calories: any;
            protein_g: any;
            carbs_g: any;
            fats_g: any;
            fiber_g: any;
            sugar_g: any;
          }
        ) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein_g || 0),
          carbs: acc.carbs + (meal.carbs_g || 0),
          fat: acc.fat + (meal.fats_g || 0),
          fiber: acc.fiber + (meal.fiber_g || 0),
          sugar: acc.sugar + (meal.sugar_g || 0),
          mealCount: acc.mealCount + 1,
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          mealCount: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      throw new Error("Failed to fetch daily stats");
    }
  }

  // NEW METHODS FOR HISTORY FEATURES

  static async saveMealFeedback(
    user_id: string,
    meal_id: string,
    feedback: {
      tasteRating?: number;
      satietyRating?: number;
      energyRating?: number;
      heavinessRating?: number;
    }
  ) {
    try {
      console.log("💬 Saving feedback for meal:", meal_id, "user:", user_id);

      // Find the meal
      const meal = await prisma.meal.findFirst({
        where: {
          meal_id: parseInt(meal_id),
          user_id: user_id,
        },
      });

      if (!meal) {
        throw new Error("Meal not found");
      }

      // Get existing additives or create new object
      const existingAdditives = (meal.additives_json as any) || {};

      // Update feedback in additives_json
      const updatedAdditives = {
        ...existingAdditives,
        feedback: {
          ...existingAdditives.feedback,
          ...feedback,
          updatedAt: new Date().toISOString(),
        },
      };

      // Update the meal
      const updatedMeal = await prisma.meal.update({
        where: { meal_id: meal.meal_id },
        data: {
          additives_json: updatedAdditives,
        },
      });

      console.log("✅ Feedback saved successfully");
      return { meal_id, feedback };
    } catch (error) {
      console.error("💥 Error saving feedback:", error);
      throw new Error("Failed to save feedback");
    }
  }

  static async toggleMealFavorite(user_id: string, meal_id: string) {
    try {
      console.log("❤️ Toggling favorite for meal:", meal_id, "user:", user_id);

      // Find the meal
      const meal = await prisma.meal.findFirst({
        where: {
          meal_id: parseInt(meal_id),
          user_id: user_id,
        },
      });

      if (!meal) {
        throw new Error("Meal not found");
      }

      // Get existing additives or create new object
      const existingAdditives = (meal.additives_json as any) || {};
      const currentFavoriteStatus = existingAdditives.isFavorite || false;

      // Toggle favorite status
      const updatedAdditives = {
        ...existingAdditives,
        isFavorite: !currentFavoriteStatus,
        favoriteUpdatedAt: new Date().toISOString(),
      };

      // Update the meal
      const updatedMeal = await prisma.meal.update({
        where: { meal_id: meal.meal_id },
        data: {
          additives_json: updatedAdditives,
        },
      });

      console.log("✅ Favorite status toggled successfully");
      return { meal_id, isFavorite: !currentFavoriteStatus };
    } catch (error) {
      console.error("💥 Error toggling favorite:", error);
      throw new Error("Failed to toggle favorite");
    }
  }

  static async duplicateMeal(
    user_id: string,
    meal_id: string,
    newDate?: string
  ) {
    try {
      console.log("📋 Duplicating meal:", meal_id, "for user:", user_id);

      // Find the original meal
      const originalMeal = await prisma.meal.findFirst({
        where: {
          meal_id: parseInt(meal_id),
          user_id: user_id,
        },
      });

      if (!originalMeal) {
        console.error("❌ Meal not found for user:", user_id, "meal:", meal_id);
        throw new Error("Meal not found");
      }

      console.log("✅ Found original meal:", originalMeal.meal_name);

      // Set the new date (default to today)
      const duplicateDate = newDate ? new Date(newDate) : new Date();

      // Create a duplicate meal
      const duplicatedMeal = await prisma.meal.create({
        data: {
          user_id: originalMeal.user_id,
          image_url: originalMeal.image_url,
          meal_name: `${originalMeal.meal_name} (Copy)`,
          calories: originalMeal.calories,
          protein_g: originalMeal.protein_g,
          carbs_g: originalMeal.carbs_g,
          fats_g: originalMeal.fats_g,
          fiber_g: originalMeal.fiber_g,
          sugar_g: originalMeal.sugar_g,
          sodium_mg: originalMeal.sodium_mg,
          analysis_status: originalMeal.analysis_status,
          upload_time: duplicateDate,
          createdAt: duplicateDate,
          // Don't copy feedback or favorite status
          additives_json: {
            duplicatedFrom: originalMeal.meal_id,
            duplicatedAt: new Date().toISOString(),
          },
        },
      });

      console.log(
        "✅ Meal duplicated successfully with ID:",
        duplicatedMeal.meal_id
      );

      // Transform the meal data to match client expectations
      const transformedMeal = {
        // Server fields
        meal_id: duplicatedMeal.meal_id,
        user_id: duplicatedMeal.user_id,
        image_url: duplicatedMeal.image_url,
        upload_time: duplicatedMeal.upload_time,
        analysis_status: duplicatedMeal.analysis_status,
        meal_name: duplicatedMeal.meal_name,
        calories: duplicatedMeal.calories,
        protein_g: duplicatedMeal.protein_g,
        carbs_g: duplicatedMeal.carbs_g,
        fats_g: duplicatedMeal.fats_g,
        fiber_g: duplicatedMeal.fiber_g,
        sugar_g: duplicatedMeal.sugar_g,
        createdAt: duplicatedMeal.createdAt,

        // Computed fields for compatibility
        id: duplicatedMeal.meal_id.toString(),
        name: duplicatedMeal.meal_name || "Unknown Meal",
        description: duplicatedMeal.meal_name,
        imageUrl: duplicatedMeal.image_url,
        protein: duplicatedMeal.protein_g || 0,
        carbs: duplicatedMeal.carbs_g || 0,
        fat: duplicatedMeal.fats_g || 0,
        fiber: duplicatedMeal.fiber_g || 0,
        sugar: duplicatedMeal.sugar_g || 0,
        userId: duplicatedMeal.user_id,
      };

      return transformedMeal;
    } catch (error) {
      console.error("💥 Error duplicating meal:", error);
      throw new Error("Failed to duplicate meal");
    }
  }
}
