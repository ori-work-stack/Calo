/*
  Warnings:

  - The primary key for the `Achievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `achievement_id` on the `Achievement` table. All the data in the column will be lost.
  - The primary key for the `Badge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `badge_id` on the `Badge` table. All the data in the column will be lost.
  - The primary key for the `DailyGoal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `daily_goal_id` on the `DailyGoal` table. All the data in the column will be lost.
  - The primary key for the `UserAchievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_achievement_id` on the `UserAchievement` table. All the data in the column will be lost.
  - The primary key for the `UserBadge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_badge_id` on the `UserBadge` table. All the data in the column will be lost.
  - The primary key for the `WaterIntake` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `water_intake_id` on the `WaterIntake` table. All the data in the column will be lost.
  - The required column `id` was added to the `Achievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `Badge` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `DailyGoal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `UserAchievement` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `UserBadge` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `WaterIntake` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievement_id_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badge_id_fkey";

-- AlterTable
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_pkey",
DROP COLUMN "achievement_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_pkey",
DROP COLUMN "badge_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Badge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DailyGoal" DROP CONSTRAINT "DailyGoal_pkey",
DROP COLUMN "daily_goal_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "DailyGoal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_pkey",
DROP COLUMN "user_achievement_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_pkey",
DROP COLUMN "user_badge_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WaterIntake" DROP CONSTRAINT "WaterIntake_pkey",
DROP COLUMN "water_intake_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "WaterIntake_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
