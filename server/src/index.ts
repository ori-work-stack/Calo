import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth";
import { nutritionRoutes } from "./routes/nutrition";
import { userRoutes } from "./routes/user";
import { questionnaireRoutes } from "./routes/questionnaire";
import chatRoutes from "./routes/chat";
import { deviceRoutes } from "./routes/devices";
import { mealPlansRoutes } from "./routes/mealPlans";
import { recommendedMenuRoutes } from "./routes/recommendedMenu";
import { calendarRoutes } from "./routes/calendar";
import statisticsRoutes from "./routes/statistics";
import foodScannerRoutes from "./routes/foodScanner";
import { healthRoutes } from "./routes/health";
import { CronJobService } from "./services/cronJobs";
import "./services/cron";
import { dailyGoalsRoutes } from "./routes/dailyGoal";

// Load environment variables
dotenv.config();

// Configuration
const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiBaseUrl: process.env.API_BASE_URL,
  clientUrl: process.env.CLIENT_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  isDevelopment: process.env.NODE_ENV !== "production",
  serverIp: process.env.API_BASE_URL,
};

// Derived configuration
const apiOrigin = config.apiBaseUrl?.replace(/\/api$/, "");

// Logging helper
const log = {
  info: (message: any, ...args: any) => console.log(`ℹ️  ${message}`, ...args),
  warn: (message: any, ...args: any) => console.log(`⚠️  ${message}`, ...args),
  success: (message: any, ...args: any) =>
    console.log(`✅ ${message}`, ...args),
  error: (message: any, ...args: any) => console.log(`❌ ${message}`, ...args),
  rocket: (message: any, ...args: any) => console.log(`🚀 ${message}`, ...args),
};

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: config.isDevelopment ? false : undefined,
    crossOriginEmbedderPolicy: false,
  })
);

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isDevelopment ? 1000 : 100, // requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    config.clientUrl,
    "http://localhost:19006",
    "http://localhost:19000",
    apiOrigin || `http://${config.serverIp}:19006`,
    apiOrigin || `http://${config.serverIp}:8081`,
    ...(config.isDevelopment ? ["*"] : []),
  ].filter(Boolean) as string[],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

app.use(cors(corsOptions));
// Body parsing middleware
app.use(cookieParser());
app.use(
  express.json({
    limit: "10mb",
    type: ["application/json", "text/plain"],
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "supabase-postgresql",
    environment: config.nodeEnv,
    version: process.env.npm_package_version || "unknown",
    uptime: process.uptime(),
    openai_enabled: !!config.openaiApiKey,
  });
});

// Test endpoint
app.get("/test", (req, res) => {
  log.info("Test endpoint accessed from:", req.ip);
  res.json({
    message: "Server is reachable!",
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    origin: req.headers.origin,
    openai_enabled: !!config.openaiApiKey,
  });
});

// API routes with prefix
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/questionnaire", questionnaireRoutes);
apiRouter.use("/nutrition", nutritionRoutes);
apiRouter.use("/recommended-menus", recommendedMenuRoutes);
apiRouter.use("/user", userRoutes);
apiRouter.use("/devices", deviceRoutes);
apiRouter.use("/calendar", calendarRoutes);
apiRouter.use("/meal-plans", mealPlansRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/food-scanner", foodScannerRoutes);
apiRouter.use("/", statisticsRoutes);
apiRouter.use("/daily-goals", dailyGoalsRoutes);

app.use("/api", apiRouter);

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Startup logging
const logStartup = () => {
  log.rocket("Starting server...");
  log.info(`Environment: ${config.nodeEnv}`);
  log.info(`Port: ${config.port}`);
  log.info(`API Base URL: ${config.apiBaseUrl || "Not set"}`);

  if (config.openaiApiKey) {
    log.success("OpenAI API key found - AI features enabled");
  } else {
    log.warn("No OpenAI API key found. AI features will use mock data.");
    log.info("To enable AI features, set OPENAI_API_KEY in your .env file");
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  log.info(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    log.info("Server closed successfully");
    process.exit(0);
  });
};

// Start server
const server = app.listen(config.port, "0.0.0.0", () => {
  logStartup();
  log.rocket(`Server running on port ${config.port}`);
  log.info(`Database: Supabase PostgreSQL`);
  log.info(`Environment: ${config.nodeEnv}`);
  log.info(`Access from phone: http://${config.serverIp}:${config.port}`);
  log.success("Cookie-based authentication enabled");
  log.info(`Test endpoint: http://${config.serverIp}:${config.port}/test`);
  log.info(`Health check: http://${config.serverIp}:${config.port}/health`);

  if (!config.openaiApiKey) {
    log.warn(
      "Note: AI features are using mock data. Add OPENAI_API_KEY to enable real AI analysis."
    );
  }
  // Initialize cron jobs
  CronJobService.initializeCronJobs();

  // Create daily goals for existing users
  CronJobService.createDailyGoalsForAllUsers();
});

// Handle process termination
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  log.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
