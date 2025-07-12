import { Router } from "express";

const router = Router();

// GET /api/health - Simple health check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
  });
});

export { router as healthRoutes };
