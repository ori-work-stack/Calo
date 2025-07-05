"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Database connection configuration
const getDatabaseUrl = () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL environment variable is not set");
    }
    return url;
};
exports.prisma = globalThis.__prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["error", "warn"]
            : ["error"],
        errorFormat: "pretty",
    });
if (process.env.NODE_ENV === "development") {
    globalThis.__prisma = exports.prisma;
}
// Test database connection
exports.prisma.$connect()
    .then(() => {
    console.log("✅ Database connected successfully");
})
    .catch((error) => {
    console.error("❌ Database connection failed:", error);
});
// Graceful shutdown
process.on("beforeExit", async () => {
    await exports.prisma.$disconnect();
});
process.on("SIGINT", async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=database.js.map