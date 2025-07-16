import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { DailyGoalsService } from "../services/dailyGoal";

const router = Router();

// GET /api/daily-goals - Get user's daily goals
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const goals = await DailyGoalsService.getDailyGoals(userId);

    res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error("Error fetching daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch daily goals",
    });
  }
});

// PUT /api/daily-goals - Update user's daily goals
router.put("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const goals = await DailyGoalsService.createOrUpdateDailyGoals(userId);

    res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error("Error updating daily goals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update daily goals",
    });
  }
});

export { router as dailyGoalsRoutes };
