import { Router } from "express";
import { CalendarService } from "../services/calendar";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get calendar data for a specific month
router.get("/data/:year/:month", async (req: AuthRequest, res) => {
  try {
    const { year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: "Invalid year or month provided",
      });
    }

    console.log("📅 Get calendar data request for:", yearNum, monthNum);

    const calendarData = await CalendarService.getCalendarData(
      req.user.user_id,
      yearNum,
      monthNum
    );

    res.json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    console.error("💥 Get calendar data error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch calendar data";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get statistics for a specific month
router.get("/statistics/:year/:month", async (req: AuthRequest, res) => {
  try {
    const { year, month } = req.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: "Invalid year or month provided",
      });
    }

    console.log("📊 Get statistics request for:", yearNum, monthNum);

    const statistics = await CalendarService.getStatistics(
      req.user.user_id,
      yearNum,
      monthNum
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("💥 Get statistics error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch statistics";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Add event to a specific date
router.post("/events", async (req: AuthRequest, res) => {
  try {
    const { date, title, type } = req.body;

    if (!date || !title) {
      return res.status(400).json({
        success: false,
        error: "Date and title are required",
      });
    }

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    console.log("📝 Add event request:", { date, title, type });

    const event = await CalendarService.addEvent(
      req.user.user_id,
      date,
      title,
      type || "general"
    );

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("💥 Add event error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add event";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// Get events for a specific date
router.get("/events/:date", async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    console.log("📅 Get events request for date:", date);

    const events = await CalendarService.getEventsForDate(
      req.user.user_id,
      date
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("💥 Get events error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export { router as calendarRoutes };
