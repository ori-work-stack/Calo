import { Router } from "express";
import { MealPlanService } from "../services/mealPlans";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Validation schemas
const createMealPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  plan_type: z.enum(["WEEKLY", "DAILY", "THREE_DAYS"] as const),
  meals_per_day: z.number().min(2).max(6),
  snacks_per_day: z.number().min(0).max(3),
  rotation_frequency_days: z.number().min(1).max(14),
  include_leftovers: z.boolean(),
  fixed_meal_times: z.boolean(),
  dietary_preferences: z.array(z.string()),
  excluded_ingredients: z.array(z.string()),
});

const replaceMealSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  meal_timing: z.string(),
  meal_order: z.number().min(1),
  preferences: z
    .object({
      dietary_category: z.string().optional(),
      max_prep_time: z.number().optional(),
    })
    .optional(),
});

const mealPreferenceSchema = z.object({
  template_id: z.string(),
  preference_type: z.enum(["favorite", "dislike", "rating"]),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

// Create a new AI-powered meal plan
router.post("/create", async (req: AuthRequest, res) => {
  try {
    const validatedData = createMealPlanSchema.parse(req.body);

    console.log("🍽️ Create AI meal plan request for user:", req.user.user_id);

    // Check user's AI request limits
    const user = await req.app.locals.prisma?.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        aiRequestsCount: true,
        aiRequestsResetAt: true,
        subscription_type: true,
      },
    });

    if (user) {
      // Check if we need to reset daily limits
      const now = new Date();
      const resetTime = new Date(user.aiRequestsResetAt);
      const hoursSinceReset =
        (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        await req.app.locals.prisma?.user.update({
          where: { user_id: req.user.user_id },
          data: {
            aiRequestsCount: 0,
            aiRequestsResetAt: now,
          },
        });
        user.aiRequestsCount = 0;
      }

      // Check limits based on subscription
      const limits = {
        FREE: 2, // 2 meal plans per day for free users
        BASIC: 5,
        PREMIUM: 20,
      };

      const userLimit =
        limits[user.subscription_type as keyof typeof limits] || limits.FREE;

      if (user.aiRequestsCount >= userLimit) {
        return res.status(429).json({
          success: false,
          error: `Daily AI meal plan limit reached (${userLimit}). Upgrade your subscription for more meal plans.`,
        });
      }

      // Increment AI request count
      await req.app.locals.prisma?.user.update({
        where: { user_id: req.user.user_id },
        data: {
          aiRequestsCount: user.aiRequestsCount + 1,
        },
      });
    }

    const mealPlan = await MealPlanService.createUserMealPlan(
      req.user.user_id,
      validatedData
    );

    res.json({
      success: true,
      data: mealPlan,
      message: "AI-powered meal plan created successfully!",
    });
  } catch (error) {
    console.error("💥 Create AI meal plan error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create meal plan";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get user's current meal plan
router.get("/current", async (req: AuthRequest, res) => {
  try {
    console.log("📋 Get current meal plan request for user:", req.user.user_id);

    const weeklyPlan = await MealPlanService.getUserMealPlan(req.user.user_id);

    res.json({
      success: true,
      data: weeklyPlan,
    });
  } catch (error) {
    console.error("💥 Get meal plan error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get meal plan";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get specific meal plan
router.get("/:plan_id", async (req: AuthRequest, res) => {
  try {
    const { plan_id } = req.params;

    console.log(
      "📋 Get meal plan request:",
      plan_id,
      "for user:",
      req.user.user_id
    );

    const weeklyPlan = await MealPlanService.getUserMealPlan(
      req.user.user_id,
      plan_id
    );

    res.json({
      success: true,
      data: weeklyPlan,
    });
  } catch (error) {
    console.error("💥 Get meal plan error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to get meal plan";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Replace a meal in the plan with AI-generated alternative
router.put("/:plan_id/replace", async (req: AuthRequest, res) => {
  try {
    const { plan_id } = req.params;
    const validatedData = replaceMealSchema.parse(req.body);

    console.log("🔄 AI meal replacement request for plan:", plan_id);

    const result = await MealPlanService.replaceMealInPlan(
      req.user.user_id,
      plan_id,
      validatedData.day_of_week,
      validatedData.meal_timing,
      validatedData.meal_order,
      validatedData.preferences
    );

    res.json({
      success: true,
      data: result,
      message: "Meal replaced with AI-generated alternative!",
    });
  } catch (error) {
    console.error("💥 AI meal replacement error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to replace meal";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Generate shopping list
router.post("/:plan_id/shopping-list", async (req: AuthRequest, res) => {
  try {
    const { plan_id } = req.params;
    const { week_start_date } = req.body;

    if (!week_start_date) {
      return res.status(400).json({
        success: false,
        error: "Week start date is required",
      });
    }

    console.log("🛒 Generate shopping list request for plan:", plan_id);

    const shoppingList = await MealPlanService.generateShoppingList(
      req.user.user_id,
      plan_id,
      week_start_date
    );

    res.json({
      success: true,
      data: shoppingList,
    });
  } catch (error) {
    console.error("💥 Generate shopping list error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate shopping list";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Save meal preference (affects future AI recommendations)
router.post("/preferences", async (req: AuthRequest, res) => {
  try {
    const validatedData = mealPreferenceSchema.parse(req.body);

    console.log("💝 Save meal preference request for user:", req.user.user_id);

    const preference = await MealPlanService.saveMealPreference(
      req.user.user_id,
      validatedData.template_id,
      validatedData.preference_type,
      validatedData.rating,
      validatedData.notes
    );

    res.json({
      success: true,
      data: preference,
      message: "Preference saved! This will improve future AI recommendations.",
    });
  } catch (error) {
    console.error("💥 Save meal preference error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save meal preference";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export { router as mealPlanRoutes };
