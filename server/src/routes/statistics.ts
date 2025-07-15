import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth"; // Import your AuthRequest type here
import { StatisticsService } from "../services/statistics";
import { z } from "zod";

const router = Router();

const periodSchema = z.enum(["today", "week", "month", "custom"]);

// Get nutrition statistics
router.get(
  "/statistics",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      console.error("❌ Statistics request without user ID");
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      console.log(
        `📊 Statistics request for user: ${userId}, period: ${
          req.query.period || "week"
        }`
      );

      const period = periodSchema.parse(req.query.period || "week");
      const statistics = await StatisticsService.getNutritionStatistics(
        userId,
        period
      );

      console.log(`✅ Statistics fetched successfully for user: ${userId}`);
      res.json(statistics);
    } catch (error) {
      console.error("❌ Error fetching statistics:", error);

      // Return a more detailed error response
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid period parameter",
          details: error.errors,
        });
      }

      res.status(500).json({
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Export report as PDF
router.get(
  "/export-report",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const pdfBuffer = await StatisticsService.generatePDFReport(userId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=nutrition-report.pdf"
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }
);

// Get insights and recommendations
router.get(
  "/insights",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.user_id?.toString();

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const insights = await StatisticsService.generateInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  }
);

export default router;
