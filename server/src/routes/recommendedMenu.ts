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

// POST /api/recommended-menus/generate - Generate new menu
router.post("/generate", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const {
      days = 7,
      targetCalories,
      dietaryPreferences,
      excludedIngredients,
      budget,
    } = req.body;

    const menu = await RecommendedMenuService.generatePersonalizedMenu({
      userId,
      days,
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

export { router as recommendedMenuRoutes };
