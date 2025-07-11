import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { RecommendedMenuService } from "../services/recommendedMenu";

const router = Router();

// GET /api/recommended-menus - Get user's recommended menus
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const menus = await RecommendedMenuService.getUserMenus(userId);

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

    res.json({
      success: true,
      message: "Menu generated successfully",
      data: menu,
    });
  } catch (error) {
    console.error("💥 Error generating menu:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate menu",
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
