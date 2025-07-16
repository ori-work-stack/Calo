import { Router, Request, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ChatService } from "../services/chat";
import { z } from "zod";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
});

const healthBasedRecommendationSchema = z.object({
  userId: z.string(),
  healthData: z.object({
    steps: z.number(),
    caloriesBurned: z.number(),
    heartRate: z.number(),
    distance: z.number(),
    activeMinutes: z.number(),
    date: z.string(),
  }),
  prompt: z.string().optional(),
});

// Send chat message
router.post(
  "/message",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const { message } = chatSchema.parse(req.body);
      const response = await ChatService.processMessage(userId, message);

      res.json({
        response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  }
);

// Health-based recommendation
router.post(
  "/health-based-recommendation",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const { healthData, prompt } = healthBasedRecommendationSchema.parse(
        req.body
      );

      // Generate AI prompt with health data and personal info
      const recommendation = await ChatService.processHealthBasedRecommendation(
        userId,
        healthData,
        prompt
      );

      res.json({
        recommendation,
        healthData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health-based recommendation error:", error);
      res
        .status(500)
        .json({ error: "Failed to generate health-based recommendation" });
    }
  }
);

export default router;
