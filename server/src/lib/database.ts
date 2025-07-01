import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Supabase connection configuration
const getDatabaseUrl = () => {
  const url =
    process.env.DATEBASE_URL ||
    "postgresql://postgres.ymmrmgayuqporqmfkger:%249DuivW-9eRNZ%40%2B@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  if (!url) {
    throw new Error(
      `DATABASE_URL environment variable is not set, ${process.env.DATABASE_URL}`
    );
  }

  // Use Supabase connection pooling for better performance
  if (url.includes("supabase.co") && !url.includes("pooler")) {
    return url.replace("db.", "db-pooler.");
  }

  return url;
};

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
