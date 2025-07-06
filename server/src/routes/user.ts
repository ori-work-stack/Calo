import { Router } from "express";
import { prisma } from "../lib/database";
import { updateProfileSchema, updateSubscriptionSchema } from "../types/auth";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { StatisticsService } from "../services/statistics";

const router = Router();

router.put(
  "/profile",
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);

      const updatedUser = await prisma.user.update({
        where: { user_id: req.user.user_id },
        data: validatedData,
        select: {
          user_id: true,
          email: true,
          name: true,
          subscription_type: true,
          age: true,
          weight_kg: true,
          height_cm: true,
          ai_requests_count: true,
          is_questionnaire_completed: true,
          created_at: true,
        },
      });

      res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        next(error);
      }
    }
  }
);

router.put(
  "/subscription",
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const validatedData = updateSubscriptionSchema.parse(req.body);

      const updatedUser = await prisma.user.update({
        where: { user_id: req.user.user_id },
        data: {
          subscription_type: validatedData.subscription_type,
          subscription_start: new Date(),
        },
        select: {
          user_id: true,
          email: true,
          name: true,
          subscription_type: true,
          age: true,
          weight_kg: true,
          height_cm: true,
          ai_requests_count: true,
          is_questionnaire_completed: true,
          created_at: true,
        },
      });

      res.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        next(error);
      }
    }
  }
);

router.get(
  "/subscription-info",
  authenticateToken,
  async (req: AuthRequest, res) => {
    const subscriptionInfo = {
      FREE: { dailyRequests: 2, name: "Free Plan" },
      BASIC: { dailyRequests: 20, name: "Basic Plan" },
      PREMIUM: { dailyRequests: 50, name: "Premium Plan" },
    };

    const userSubscriptionType = req.user.subscription_type;
    const info =
      subscriptionInfo[userSubscriptionType as keyof typeof subscriptionInfo] ||
      subscriptionInfo.FREE;

    res.json({
      success: true,
      subscription: {
        ...info,
        currentRequests: req.user.ai_requests_count,
        resetAt: req.user.ai_requests_reset_at,
      },
    });
  }
);

// NEW ENDPOINT: Get global nutritional statistics
router.get(
  "/global-statistics",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      console.log("📊 Global statistics request from user:", req.user.user_id);

      // You can optionally accept a query param ?period=week|month|custom
      const period =
        (req.query.period as "week" | "month" | "custom") || "week";

      const statistics = await StatisticsService.getNutritionStatistics(
        req.user.user_id,
        period
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("💥 Global statistics error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch global statistics";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
);

export { router as userRoutes };
