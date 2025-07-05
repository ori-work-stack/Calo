"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nutritionRoutes = void 0;
const express_1 = require("express");
const nutrition_1 = require("../services/nutrition");
const auth_1 = require("../middleware/auth");
const nutrition_2 = require("../types/nutrition");
const router = (0, express_1.Router)();
exports.nutritionRoutes = router;
// Apply auth middleware to all routes
router.use(auth_1.authenticateToken);
// Analyze meal endpoint
router.post("/analyze", async (req, res) => {
    try {
        console.log("Analyze meal request received");
        console.log("Request body keys:", Object.keys(req.body));
        // Validate request body
        const validationResult = nutrition_2.mealAnalysisSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error("Validation error:", validationResult.error);
            return res.status(400).json({
                success: false,
                error: "Invalid request data: " +
                    validationResult.error.errors.map((e) => e.message).join(", "),
            });
        }
        const { imageBase64, language = "english", date, updateText, } = validationResult.data;
        if (!imageBase64 || imageBase64.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Image data is required",
            });
        }
        console.log("Processing meal analysis for user:", req.user.user_id);
        console.log("Image data length:", imageBase64.length);
        const result = await nutrition_1.NutritionService.analyzeMeal(req.user.user_id, {
            imageBase64,
            language,
            date: date || new Date().toISOString().split("T")[0],
            updateText,
        });
        console.log("Analysis completed successfully");
        res.json(result);
    }
    catch (error) {
        console.error("Analyze meal error:", error);
        const message = error instanceof Error ? error.message : "Failed to analyze meal";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Update meal endpoint
router.put("/update", async (req, res) => {
    try {
        console.log("Update meal request received");
        const validationResult = nutrition_2.mealUpdateSchema.safeParse(req.body);
        if (!validationResult.success) {
            console.error("Validation error:", validationResult.error);
            return res.status(400).json({
                success: false,
                error: "Invalid request data: " +
                    validationResult.error.errors.map((e) => e.message).join(", "),
            });
        }
        const { meal_id, updateText, language } = validationResult.data;
        console.log("Updating meal for user:", req.user.user_id);
        const meal = await nutrition_1.NutritionService.updateMeal(req.user.user_id, {
            meal_id,
            updateText,
            language,
        });
        console.log("Meal updated successfully");
        res.json({
            success: true,
            data: meal,
        });
    }
    catch (error) {
        console.error("Update meal error:", error);
        const message = error instanceof Error ? error.message : "Failed to update meal";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Save meal endpoint
router.post("/save", async (req, res) => {
    try {
        console.log("Save meal request received");
        const { mealData, imageBase64 } = req.body;
        if (!mealData) {
            return res.status(400).json({
                success: false,
                error: "Meal data is required",
            });
        }
        console.log("Saving meal for user:", req.user.user_id);
        const meal = await nutrition_1.NutritionService.saveMeal(req.user.user_id, mealData, imageBase64);
        console.log("Meal saved successfully");
        res.json({
            success: true,
            data: meal,
        });
    }
    catch (error) {
        console.error("Save meal error:", error);
        const message = error instanceof Error ? error.message : "Failed to save meal";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Get user meals
router.get("/meals", async (req, res) => {
    try {
        console.log("Get meals request for user:", req.user.user_id);
        const meals = await nutrition_1.NutritionService.getUserMeals(req.user.user_id);
        res.json({
            success: true,
            data: meals,
        });
    }
    catch (error) {
        console.error("Get meals error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch meals";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Get daily stats
router.get("/stats/:date", async (req, res) => {
    try {
        const { date } = req.params;
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return res.status(400).json({
                success: false,
                error: "Date must be in YYYY-MM-DD format",
            });
        }
        console.log("Get stats request for user:", req.user.user_id, "date:", date);
        const stats = await nutrition_1.NutritionService.getDailyStats(req.user.user_id, date);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error("Get stats error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch stats";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// NEW ENDPOINTS FOR HISTORY FEATURES
// Save meal feedback (ratings)
router.post("/meals/:mealId/feedback", async (req, res) => {
    try {
        const { mealId } = req.params;
        const feedback = req.body;
        console.log("💬 Save feedback request for meal:", mealId);
        console.log("📊 Feedback data:", feedback);
        const result = await nutrition_1.NutritionService.saveMealFeedback(req.user.user_id, mealId, feedback);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("💥 Save feedback error:", error);
        const message = error instanceof Error ? error.message : "Failed to save feedback";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Toggle meal favorite status
router.post("/meals/:mealId/favorite", async (req, res) => {
    try {
        const { mealId } = req.params;
        console.log("❤️ Toggle favorite request for meal:", mealId);
        const result = await nutrition_1.NutritionService.toggleMealFavorite(req.user.user_id, mealId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("💥 Toggle favorite error:", error);
        const message = error instanceof Error ? error.message : "Failed to toggle favorite";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
// Duplicate meal to a new date
router.post("/meals/:mealId/duplicate", async (req, res) => {
    try {
        const { mealId } = req.params;
        const { newDate } = req.body;
        console.log("📋 Duplicate meal request for meal:", mealId);
        console.log("📅 New date:", newDate);
        console.log("🔍 Request body:", req.body);
        // Validate mealId
        if (!mealId || mealId === "undefined") {
            return res.status(400).json({
                success: false,
                error: "Invalid meal ID provided",
            });
        }
        const result = await nutrition_1.NutritionService.duplicateMeal(req.user.user_id, mealId, newDate);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("💥 Duplicate meal error:", error);
        const message = error instanceof Error ? error.message : "Failed to duplicate meal";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
//# sourceMappingURL=nutrition.js.map