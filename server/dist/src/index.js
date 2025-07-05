"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const nutrition_1 = require("./routes/nutrition");
const user_1 = require("./routes/user");
const calendar_1 = require("./routes/calendar");
const devices_1 = require("./routes/devices");
const mealPlans_1 = require("./routes/mealPlans");
const statistics_1 = __importDefault(require("./routes/statistics"));
require("./services/cron");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
const API_BASE_URL = process.env.API_BASE_URL; // e.g. "http://192.168.1.70:5000/api"
// Extract base origin (without /api)
const apiOrigin = API_BASE_URL ? API_BASE_URL.replace(/\/api$/, "") : null;
console.log(`API Base URL: ${API_BASE_URL}`);
console.log("🚀 Starting server...");
console.log("📊 Environment:", process.env.NODE_ENV || "development");
console.log("🔌 Port:", PORT);
// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️  WARNING: No OpenAI API key found. AI features will use mock data.");
    console.log("💡 To enable AI features, set OPENAI_API_KEY in your .env file");
}
else {
    console.log("✅ OpenAI API key found - AI features enabled");
}
app.use((0, helmet_1.default)());
// CORS configuration - replace all hardcoded IPs with apiOrigin if available
app.use((0, cors_1.default)({
    origin: [
        process.env.CLIENT_URL || "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:19000",
        apiOrigin || "http://192.168.1.70:19006",
        apiOrigin || "http://192.168.1.70:8081",
        // You can add more allowed origins if needed
        "*", // (for development, remove this in production)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));
// Cookie parser middleware - MUST be before routes
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "supabase-postgresql",
        environment: process.env.NODE_ENV || "development",
        ip: req.ip,
        openai_enabled: !!process.env.OPENAI_API_KEY,
    });
});
// Test endpoint for connectivity
app.get("/test", (req, res) => {
    console.log("🧪 Test endpoint hit from:", req.ip);
    res.json({
        message: "Server is reachable!",
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        origin: req.headers.origin,
        openai_enabled: !!process.env.OPENAI_API_KEY,
    });
});
// API routes
app.use("/api/auth", auth_1.authRoutes);
app.use("/api/nutrition", nutrition_1.nutritionRoutes);
app.use("/api/user", user_1.userRoutes);
app.use("/api/devices", devices_1.deviceRoutes);
app.use("/api/calendar", calendar_1.calendarRoutes);
app.use("/api/meal-plans", mealPlans_1.mealPlanRoutes);
app.use("/api", statistics_1.default);
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server - binding to 0.0.0.0 allows external connections
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: Supabase PostgreSQL`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📱 Access from phone: http://192.168.1.70:${PORT}`);
    console.log(`🍪 Cookie-based authentication enabled`);
    console.log(`🧪 Test endpoint: http://192.168.1.70:${PORT}/test`);
    console.log(`💚 Health check: http://192.168.1.70:${PORT}/health`);
    if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️  Note: AI features are using mock data. Add OPENAI_API_KEY to enable real AI analysis.");
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map