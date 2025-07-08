import { Router } from "express";
import { NutritionService } from "../services/nutrition";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { mealAnalysisSchema, mealUpdateSchema } from "../types/nutrition";
import { prisma } from "../lib/database";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Analyze meal endpoint
router.post("/analyze", async (req: AuthRequest, res) => {
  try {
    console.log("Analyze meal request received");
    console.log("Request body keys:", Object.keys(req.body));

    // Validate request body
    const validationResult = mealAnalysisSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return res.status(400).json({
        success: false,
        error:
          "Invalid request data: " +
          validationResult.error.errors.map((e) => e.message).join(", "),
      });
    }

    const {
      imageBase64,
      language = "english",
      date,
      updateText,
    } = validationResult.data;

    if (!imageBase64 || imageBase64.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Image data is required",
      });
    }

    console.log("Processing meal analysis for user:", req.user.user_id);
    console.log("Image data length:", imageBase64.length);

    const result = await NutritionService.analyzeMeal(req.user.user_id, {
      imageBase64,
      language,
      date: date || new Date().toISOString().split("T")[0],
      updateText,
    });
    console.log("nutrition.ts in routes", result);
    console.log("Analysis completed successfully");
    res.json(result);
  } catch (error) {
    console.error("Analyze meal error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze meal";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Update meal endpoint
router.put("/update", async (req: AuthRequest, res) => {
  try {
    console.log("Update meal request received");

    const validationResult = mealUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return res.status(400).json({
        success: false,
        error:
          "Invalid request data: " +
          validationResult.error.errors.map((e) => e.message).join(", "),
      });
    }

    const { meal_id, updateText, language } = validationResult.data;

    console.log("Updating meal for user:", req.user.user_id);

    const meal = await NutritionService.updateMeal(req.user.user_id, {
      meal_id,
      updateText,
      language,
    });

    console.log("Meal updated successfully");
    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error("Update meal error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update meal";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Save meal endpoint
router.post("/save", async (req: AuthRequest, res) => {
  try {
    console.log("Save meal request received");

    const { mealData, imageBase64 } = req.body;

    if (!mealData) {
      return res.status(400).json({
        success: false,
        error: "Meal data is required",
      });
    }

    console.log("Saving meal for user:", req.user.user_id);

    const meal = await NutritionService.saveMeal(
      req.user.user_id,
      mealData,
      imageBase64
    );

    console.log("Meal saved successfully");
    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error("Save meal error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save meal";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get user meals
router.get("/meals", async (req: AuthRequest, res) => {
  try {
    console.log("Get meals request for user:", req.user.user_id);

    const meals = await NutritionService.getUserMeals(req.user.user_id);

    res.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error("Get meals error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch meals";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get daily stats
router.get("/stats/:date", async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    console.log("Get stats request for user:", req.user.user_id, "date:", date);

    const stats = await NutritionService.getDailyStats(req.user.user_id, date);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// NEW ENDPOINTS FOR HISTORY FEATURES

// Save meal feedback (ratings)
router.post("/meals/:mealId/feedback", async (req: AuthRequest, res) => {
  try {
    const { mealId } = req.params;
    const feedback = req.body;

    console.log("💬 Save feedback request for meal:", mealId);
    console.log("📊 Feedback data:", feedback);

    const result = await NutritionService.saveMealFeedback(
      req.user.user_id,
      mealId,
      feedback
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("💥 Save feedback error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save feedback";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Toggle meal favorite status
router.post("/meals/:mealId/favorite", async (req: AuthRequest, res) => {
  try {
    const { mealId } = req.params;

    console.log("❤️ Toggle favorite request for meal:", mealId);

    const result = await NutritionService.toggleMealFavorite(
      req.user.user_id,
      mealId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("💥 Toggle favorite error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to toggle favorite";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Duplicate meal to a new date
router.post("/meals/:mealId/duplicate", async (req: AuthRequest, res) => {
  try {
    const { mealId } = req.params;
    const { newDate } = req.body;

    console.log("📋 Duplicate meal request for meal:", mealId);
    console.log("📅 New date:", newDate);
    console.log("🔍 Request body:", req.body);

    // Validate mealId
    if (!mealId || mealId === "undefined") {
      return res.status(400).json({
        success: false,
        error: "Invalid meal ID provided",
      });
    }

    const result = await NutritionService.duplicateMeal(
      req.user.user_id,
      mealId,
      newDate
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("💥 Duplicate meal error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to duplicate meal";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get meal details with full nutrition info
router.get("/meals/:meal_id/details", authenticateToken, async (req, res) => {
  try {
    const { meal_id } = req.params;
    const userId = (req as any).user.user_id;

    console.log("🔍 Fetching full meal details:", meal_id);

    const meal = await prisma.meal.findFirst({
      where: {
        meal_id: parseInt(meal_id),
        user_id: userId,
      },
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: "Meal not found",
      });
    }

    // Format the complete meal data with all nutrition fields from schema
    const fullMealData = {
      ...meal,
      // Include all nutrition fields from your Prisma schema
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      saturated_fats_g: meal.saturated_fats_g,
      polyunsaturated_fats_g: meal.polyunsaturated_fats_g,
      monounsaturated_fats_g: meal.monounsaturated_fats_g,
      omega_3_g: meal.omega_3_g,
      omega_6_g: meal.omega_6_g,
      fiber_g: meal.fiber_g,
      soluble_fiber_g: meal.soluble_fiber_g,
      insoluble_fiber_g: meal.insoluble_fiber_g,
      sugar_g: meal.sugar_g,
      cholesterol_mg: meal.cholesterol_mg,
      sodium_mg: meal.sodium_mg,
      alcohol_g: meal.alcohol_g,
      caffeine_mg: meal.caffeine_mg,
      liquids_ml: meal.liquids_ml,
      serving_size_g: meal.serving_size_g,
      allergens_json: meal.allergens_json,
      vitamins_json: meal.vitamins_json,
      micronutrients_json: meal.micronutrients_json,
      glycemic_index: meal.glycemic_index,
      insulin_index: meal.insulin_index,
      food_category: meal.food_category,
      processing_level: meal.processing_level,
      cooking_method: meal.cooking_method,
      additives_json: meal.additives_json,
      health_risk_notes: meal.health_risk_notes,
      ingredients: meal.ingredients,
    };

    console.log("✅ Full meal details retrieved");

    res.json({
      success: true,
      data: fullMealData,
    });
  } catch (error) {
    console.error("💥 Get meal details error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch meal details",
    });
  }
});

router.get("/meals/:meal_id", authenticateToken, async (req, res) => {
  try {
    const { meal_id } = req.params;
    const userId = (req as any).user.user_id;

    console.log("🔍 Fetching meal:", meal_id);

    const meal = await prisma.meal.findFirst({
      where: {
        meal_id: parseInt(meal_id),
        user_id: userId,
      },
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: "Meal not found",
      });
    }

    console.log("✅ Meal retrieved");

    res.json({
      success: true,
      data: meal,
    });
  } catch (error) {
    console.error("💥 Get meal error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch meal",
    });
  }
});

export { router as nutritionRoutes };
