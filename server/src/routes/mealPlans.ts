import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { MealPlanService } from "../services/mealPlans";
import { prisma } from "../lib/database";
import { MealTiming } from "@prisma/client";

const router = Router();

// Get current/active meal plan
router.get("/current", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Getting current meal plan for user:", req.user?.user_id);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Try to get the active meal plan first
    const activePlan = await MealPlanService.getActiveMealPlan(user_id);

    if (activePlan) {
      // Get the full weekly plan data
      const weeklyPlan = await MealPlanService.getUserMealPlan(
        user_id,
        activePlan.plan_id
      );

      console.log("✅ Active meal plan found and retrieved");
      return res.json({
        success: true,
        data: weeklyPlan,
        planId: activePlan.plan_id,
        planName: activePlan.name,
        hasActivePlan: true,
      });
    } else {
      // No active plan, return empty structure
      console.log("⚠️ No active meal plan found");
      return res.json({
        success: true,
        data: {},
        planId: null,
        planName: null,
        hasActivePlan: false,
      });
    }
  } catch (error) {
    console.error("💥 Error getting current meal plan:", error);

    // Return empty structure on error to prevent frontend crashes
    return res.json({
      success: true,
      data: {},
      planId: null,
      planName: null,
      hasActivePlan: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Create new meal plan
router.post("/create", authenticateToken, async (req, res) => {
  try {
    console.log("🤖 Creating meal plan for user:", req.user?.user_id);
    console.log("📝 Config:", req.body);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const config = req.body;

    // Validate required fields
    if (!config.name || !config.plan_type || !config.meals_per_day) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, plan_type, meals_per_day",
      });
    }

    const mealPlan = await MealPlanService.createUserMealPlan(user_id, config);

    console.log("✅ Meal plan created successfully");
    res.json({
      success: true,
      data: mealPlan,
      message: "Meal plan created successfully",
    });
  } catch (error) {
    console.error("💥 Error creating meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create meal plan",
    });
  }
});

// Replace meal in plan
router.put("/:planId/replace", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Replacing meal in plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const {
      day_of_week,
      meal_timing,
      meal_order = 0,
      preferences = {},
    } = req.body;

    // Validate required fields
    if (day_of_week === undefined || !meal_timing) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: day_of_week, meal_timing",
      });
    }

    const result = await MealPlanService.replaceMealInPlan(
      user_id,
      planId,
      day_of_week,
      meal_timing,
      meal_order,
      preferences
    );

    console.log("✅ Meal replaced successfully");
    res.json({
      success: true,
      data: result,
      message: "Meal replaced successfully",
    });
  } catch (error) {
    console.error("💥 Error replacing meal:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to replace meal",
    });
  }
});

// Generate shopping list
router.post("/:planId/shopping-list", authenticateToken, async (req, res) => {
  try {
    console.log("🛒 Generating shopping list for plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const { week_start_date } = req.body;

    if (!week_start_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: week_start_date",
      });
    }

    const shoppingList = await MealPlanService.generateShoppingList(
      user_id,
      planId,
      week_start_date
    );

    console.log("✅ Shopping list generated successfully");
    res.json({
      success: true,
      data: shoppingList,
      message: "Shopping list generated successfully",
    });
  } catch (error) {
    console.error("💥 Error generating shopping list:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate shopping list",
    });
  }
});

// Save meal preference
router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    console.log("💝 Saving meal preference");

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { template_id, preference_type, rating, notes } = req.body;

    if (!template_id || !preference_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: template_id, preference_type",
      });
    }

    const preference = await MealPlanService.saveMealPreference(
      user_id,
      template_id,
      preference_type,
      rating,
      notes
    );

    console.log("✅ Meal preference saved successfully");
    res.json({
      success: true,
      data: preference,
      message: "Preference saved successfully",
    });
  } catch (error) {
    console.error("💥 Error saving meal preference:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save preference",
    });
  }
});

// Get meal plan by ID
router.get("/:planId", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Getting meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    const weeklyPlan = await MealPlanService.getUserMealPlan(user_id, planId);

    console.log("✅ Meal plan retrieved successfully");
    res.json({
      success: true,
      data: weeklyPlan,
      planId: planId,
    });
  } catch (error) {
    console.error("💥 Error getting meal plan:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get meal plan",
    });
  }
});

// Deactivate meal plan
router.post("/:planId/deactivate", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Deactivating meal plan:", req.params.planId);

    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { planId } = req.params;
    await MealPlanService.deactivateMealPlan(user_id, planId);

    console.log("✅ Meal plan deactivated successfully");
    res.json({
      success: true,
      message: "Meal plan deactivated successfully",
    });
  } catch (error) {
    console.error("💥 Error deactivating meal plan:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to deactivate meal plan",
    });
  }
});

// Get user's recommended menus
router.get("/recommended", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    const recommendedMenus = await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    res.json({
      success: true,
      menus: recommendedMenus,
    });
  } catch (error) {
    console.error("Get recommended menus error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recommended menus",
    });
  }
});

// Generate new recommended menu
router.post(
  "/recommended/generate",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user.user_id;

      // Get user's questionnaire and nutrition plan
      const [questionnaire, nutritionPlan] = await Promise.all([
        prisma.userQuestionnaire.findFirst({
          where: { user_id: userId },
          orderBy: { date_completed: "desc" },
        }),
        prisma.nutritionPlan.findFirst({
          where: { user_id: userId },
        }),
      ]);

      if (!questionnaire || !nutritionPlan) {
        return res.status(400).json({
          success: false,
          error: "User questionnaire or nutrition plan not found",
        });
      }

      // Create a new recommended menu
      const menu = await prisma.recommendedMenu.create({
        data: {
          user_id: userId,
          title: `Personalized Menu - ${new Date().toLocaleDateString()}`,
          description: `Based on your ${questionnaire.main_goal} goal`,
          total_calories: nutritionPlan.goal_calories || 2000,
          total_protein: nutritionPlan.goal_protein_g || 150,
          total_carbs: nutritionPlan.goal_carbs_g || 200,
          total_fat: nutritionPlan.goal_fats_g || 70,
          created_at: new Date(),
        },
      });

      // Generate sample meals based on user preferences
      const sampleMeals = [
        {
          menu_id: menu.menu_id,
          name: "Protein Breakfast",
          meal_type: MealTiming.BREAKFAST,
          calories: Math.round((nutritionPlan.goal_calories || 2000) * 0.25),
          protein: Math.round((nutritionPlan.goal_protein_g || 150) * 0.3),
          carbs: Math.round((nutritionPlan.goal_carbs_g || 200) * 0.2),
          fat: Math.round((nutritionPlan.goal_fats_g || 70) * 0.25),
        },
        {
          menu_id: menu.menu_id,
          name: "Balanced Lunch",
          meal_type: MealTiming.LUNCH,
          calories: Math.round((nutritionPlan.goal_calories || 2000) * 0.35),
          protein: Math.round((nutritionPlan.goal_protein_g || 150) * 0.4),
          carbs: Math.round((nutritionPlan.goal_carbs_g || 200) * 0.4),
          fat: Math.round((nutritionPlan.goal_fats_g || 70) * 0.35),
        },
        {
          menu_id: menu.menu_id,
          name: "Light Dinner",
          meal_type: MealTiming.DINNER,
          calories: Math.round((nutritionPlan.goal_calories || 2000) * 0.3),
          protein: Math.round((nutritionPlan.goal_protein_g || 150) * 0.25),
          carbs: Math.round((nutritionPlan.goal_carbs_g || 200) * 0.3),
          fat: Math.round((nutritionPlan.goal_fats_g || 70) * 0.3),
        },
      ];

      await prisma.recommendedMeal.createMany({
        data: sampleMeals,
      });

      // Fetch the complete menu with meals
      const completeMenu = await prisma.recommendedMenu.findUnique({
        where: { menu_id: menu.menu_id },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
          },
        },
      });

      res.json({
        success: true,
        menu: completeMenu,
      });
    } catch (error) {
      console.error("Generate recommended menu error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate recommended menu",
      });
    }
  }
);

export { router as mealPlansRoutes };
