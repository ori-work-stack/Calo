import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { RecommendedMenuService } from "../services/recommendedMenu";
import { prisma } from "../lib/database";

const router = Router();

// GET /api/recommended-menus - Get user's recommended menus
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    console.log("📋 Fetching menus for user:", userId);

    const menus = await RecommendedMenuService.getUserMenus(userId);

    console.log("📊 Found", menus.length, "menus for user");
    menus.forEach((menu, index) => {
      console.log(`📋 Menu ${index + 1}:`, {
        menu_id: menu.menu_id,
        title: menu.title,
        meals_count: menu.meals?.length || 0,
        created_at: menu.created_at,
      });
    });

    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("💥 Error fetching recommended menus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recommended menus",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/recommended-menus/debug - Debug endpoint to check menu data
router.get("/debug", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    console.log("🐛 Debug: Checking menus for user:", userId);

    // Get raw menu count
    const menuCount = await prisma.recommendedMenu.count({
      where: { user_id: userId },
    });
 
    // Get detailed menu data
    const menus = await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const debugInfo = {
      user_id: userId,
      menu_count: menuCount,
      menus: menus.map(
        (menu: {
          menu_id: any;
          title: any;
          created_at: any;
          meals: any[];
        }) => ({
          menu_id: menu.menu_id,
          title: menu.title,
          created_at: menu.created_at,
          meals_count: menu.meals.length,
          total_ingredients: menu.meals.reduce(
            (total, meal) => total + meal.ingredients.length,
            0
          ),
          sample_meals: menu.meals.slice(0, 2).map((meal) => ({
            meal_id: meal.meal_id,
            name: meal.name,
            meal_type: meal.meal_type,
            ingredients_count: meal.ingredients.length,
          })),
        })
      ),
    };

    res.json({
      success: true,
      debug_info: debugInfo,
    });
  } catch (error) {
    console.error("💥 Debug error:", error);
    res.status(500).json({
      success: false,
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/recommended-menus/:menuId - Get specific menu
router.get("/:menuId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const { menuId } = req.params;

    const menu = await RecommendedMenuService.getMenuById(userId, menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: "Menu not found",
      });
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("💥 Error fetching menu:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch menu",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/recommended-menus/generate - Generate new menu with preferences
router.post("/generate", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    console.log("🎯 Generating menu for user:", userId);
    console.log("📋 Request body:", req.body);

    const {
      days = 7,
      mealsPerDay = "3_main", // "3_main", "3_plus_2_snacks", "2_plus_1_intermediate"
      mealChangeFrequency = "daily", // "daily", "every_3_days", "weekly", "automatic"
      includeLeftovers = false,
      sameMealTimes = true,
      targetCalories,
      dietaryPreferences,
      excludedIngredients,
      budget,
    } = req.body;

    // Validate input parameters
    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: "Days must be between 1 and 30",
      });
    }

    if (
      !["3_main", "3_plus_2_snacks", "2_plus_1_intermediate"].includes(
        mealsPerDay
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid meals per day option",
      });
    }

    console.log("✅ Input validation passed, generating menu...");

    const menu = await RecommendedMenuService.generatePersonalizedMenu({
      userId,
      days,
      mealsPerDay,
      mealChangeFrequency,
      includeLeftovers,
      sameMealTimes,
      targetCalories,
      dietaryPreferences,
      excludedIngredients,
      budget,
    });

    if (!menu) {
      throw new Error("Menu generation returned null");
    }

    console.log("🎉 Menu generated successfully!");
    console.log("📊 Menu stats:", {
      menu_id: menu?.menu_id,
      title: menu?.title,
      meals_count: menu?.meals?.length || 0,
      total_calories: menu?.total_calories,
    });

    // Ensure the response has the expected structure
    const responseData = {
      ...menu,
      // Ensure we have at least these fields for the client
      menu_id: menu.menu_id,
      title: menu.title,
      description: menu.description,
      meals: menu.meals || [],
      days_count: menu.days_count,
      total_calories: menu.total_calories,
      estimated_cost: menu.estimated_cost,
    };

    console.log("📤 Sending response with", responseData.meals.length, "meals");

    res.json({
      success: true,
      message: "Menu generated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("💥 Error generating menu:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to generate menu";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("questionnaire not found")) {
        errorMessage =
          "Please complete your questionnaire first before generating a menu";
        statusCode = 400;
      } else if (error.message.includes("budget")) {
        errorMessage = "Please set a daily food budget in your questionnaire";
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/recommended-menus/:menuId/replace-meal - Replace a specific meal
router.post(
  "/:menuId/replace-meal",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, preferences } = req.body;

      const updatedMeal = await RecommendedMenuService.replaceMeal(
        userId,
        menuId,
        mealId,
        preferences
      );

      res.json({
        success: true,
        data: updatedMeal,
      });
    } catch (error) {
      console.error("💥 Error replacing meal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to replace meal",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/favorite-meal - Mark meal as favorite
router.post(
  "/:menuId/favorite-meal",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, isFavorite } = req.body;

      await RecommendedMenuService.markMealAsFavorite(
        userId,
        menuId,
        mealId,
        isFavorite
      );

      res.json({
        success: true,
        message: isFavorite
          ? "Meal marked as favorite"
          : "Meal removed from favorites",
      });
    } catch (error) {
      console.error("💥 Error updating meal favorite:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update meal favorite",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/meal-feedback - Give feedback on meal
router.post(
  "/:menuId/meal-feedback",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;
      const { mealId, liked } = req.body;

      await RecommendedMenuService.giveMealFeedback(
        userId,
        menuId,
        mealId,
        liked
      );

      res.json({
        success: true,
        message: "Feedback recorded successfully",
      });
    } catch (error) {
      console.error("💥 Error recording meal feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/recommended-menus/:menuId/shopping-list - Get shopping list for menu
router.get(
  "/:menuId/shopping-list",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;

      const shoppingList = await RecommendedMenuService.generateShoppingList(
        userId,
        menuId
      );

      res.json({
        success: true,
        data: shoppingList,
      });
    } catch (error) {
      console.error("💥 Error generating shopping list:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate shopping list",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/recommended-menus/:menuId/start-today - Mark menu as started
router.post(
  "/:menuId/start-today",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;
      const { menuId } = req.params;

      await RecommendedMenuService.startMenuToday(userId, menuId);

      res.json({
        success: true,
        message: "Menu started for today",
      });
    } catch (error) {
      console.error("💥 Error starting menu:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start menu",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export { router as recommendedMenuRoutes };
