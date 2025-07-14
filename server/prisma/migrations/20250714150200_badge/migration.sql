/*
  Warnings:

  - The `program_duration` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('STREAK', 'GOAL', 'IMPROVEMENT', 'CONSISTENCY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "current_xp" INTEGER DEFAULT 0,
ADD COLUMN     "level" INTEGER DEFAULT 1,
ADD COLUMN     "total_points" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "UserQuestionnaire" DROP COLUMN "program_duration",
ADD COLUMN     "program_duration" TEXT;

-- DropEnum
DROP TYPE "ProgramDuration";

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "BadgeRarity" NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "requirements" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "max_progress" INTEGER NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "requirements" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlocked_date" TIMESTAMP(3),

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_user_id_badge_id_key" ON "UserBadge"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_user_id_achievement_id_key" ON "UserAchievement"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
