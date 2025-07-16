/*
  Warnings:

  - The primary key for the `Achievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Achievement` table. All the data in the column will be lost.
  - The primary key for the `Badge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Badge` table. All the data in the column will be lost.
  - The primary key for the `DailyGoal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DailyGoal` table. All the data in the column will be lost.
  - The primary key for the `UserAchievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserAchievement` table. All the data in the column will be lost.
  - The primary key for the `UserBadge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserBadge` table. All the data in the column will be lost.
  - The primary key for the `WaterIntake` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `WaterIntake` table. All the data in the column will be lost.
  - The required column `achievement_id` was added to the `Achievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `badge_id` was added to the `Badge` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `daily_goal_id` was added to the `DailyGoal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `user_achievement_id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `user_badge_id` was added to the `UserBadge` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `water_intake_id` was added to the `WaterIntake` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievement_id_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badge_id_fkey";

-- AlterTable
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_pkey",
DROP COLUMN "id",
ADD COLUMN     "achievement_id" TEXT NOT NULL,
ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("achievement_id");

-- AlterTable
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_pkey",
DROP COLUMN "id",
ADD COLUMN     "badge_id" TEXT NOT NULL,
ADD CONSTRAINT "Badge_pkey" PRIMARY KEY ("badge_id");

-- AlterTable
ALTER TABLE "DailyGoal" DROP CONSTRAINT "DailyGoal_pkey",
DROP COLUMN "id",
ADD COLUMN     "daily_goal_id" TEXT NOT NULL,
ADD CONSTRAINT "DailyGoal_pkey" PRIMARY KEY ("daily_goal_id");

-- AlterTable
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_pkey",
DROP COLUMN "id",
ADD COLUMN     "user_achievement_id" TEXT NOT NULL,
ADD CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("user_achievement_id");

-- AlterTable
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_pkey",
DROP COLUMN "id",
ADD COLUMN     "user_badge_id" TEXT NOT NULL,
ADD CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("user_badge_id");

-- AlterTable
ALTER TABLE "WaterIntake" DROP CONSTRAINT "WaterIntake_pkey",
DROP COLUMN "id",
ADD COLUMN     "water_intake_id" TEXT NOT NULL,
ADD CONSTRAINT "WaterIntake_pkey" PRIMARY KEY ("water_intake_id");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "Badge"("badge_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("achievement_id") ON DELETE CASCADE ON UPDATE CASCADE;
