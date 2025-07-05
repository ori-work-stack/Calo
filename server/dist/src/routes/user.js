"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../lib/database");
const auth_1 = require("../types/auth");
const auth_2 = require("../middleware/auth");
const statistics_1 = require("../services/statistics");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.put("/profile", auth_2.authenticateToken, async (req, res, next) => {
    try {
        const validatedData = auth_1.updateProfileSchema.parse(req.body);
        const updatedUser = await database_1.prisma.user.update({
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
                aiRequestsCount: true,
                createdAt: true,
            },
        });
        res.json({
            success: true,
            user: updatedUser,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        else {
            next(error);
        }
    }
});
router.get("/subscription-info", auth_2.authenticateToken, async (req, res) => {
    const subscriptionInfo = {
        FREE: { dailyRequests: 2, name: "Free Plan" },
        BASIC: { dailyRequests: 20, name: "Basic Plan" },
        PREMIUM: { dailyRequests: 50, name: "Premium Plan" },
    };
    const userSubscriptionType = req.user.subscription_type;
    const info = subscriptionInfo[userSubscriptionType] ||
        subscriptionInfo.FREE;
    res.json({
        success: true,
        subscription: {
            ...info,
            currentRequests: req.user.aiRequestsCount,
            resetAt: req.user.aiRequestsResetAt,
        },
    });
});
// NEW ENDPOINT: Get global nutritional statistics
router.get("/global-statistics", auth_2.authenticateToken, async (req, res) => {
    try {
        console.log("📊 Global statistics request from user:", req.user.user_id);
        // You can optionally accept a query param ?period=week|month|custom
        const period = req.query.period || "week";
        const statistics = await statistics_1.StatisticsService.getNutritionStatistics(req.user.user_id, period);
        res.json({
            success: true,
            data: statistics,
        });
    }
    catch (error) {
        console.error("💥 Global statistics error:", error);
        const message = error instanceof Error
            ? error.message
            : "Failed to fetch global statistics";
        res.status(500).json({
            success: false,
            error: message,
        });
    }
});
//# sourceMappingURL=user.js.map