/*
  Warnings:

  - You are about to drop the column `avoided_foods` on the `UserQuestionnaire` table. All the data in the column will be lost.
  - You are about to drop the column `dietary_preferences` on the `UserQuestionnaire` table. All the data in the column will be lost.
  - Added the required column `age` to the `UserQuestionnaire` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MainGoal" ADD VALUE 'ALERTNESS';
ALTER TYPE "MainGoal" ADD VALUE 'ENERGY';
ALTER TYPE "MainGoal" ADD VALUE 'SLEEP_QUALITY';
ALTER TYPE "MainGoal" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "UserQuestionnaire" DROP COLUMN "avoided_foods",
DROP COLUMN "dietary_preferences",
ADD COLUMN     "additional_activity_info" TEXT,
ADD COLUMN     "additional_personal_info" TEXT,
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "allergies_text" TEXT,
ADD COLUMN     "available_cooking_methods" JSONB,
ADD COLUMN     "body_fat_percentage" DOUBLE PRECISION,
ADD COLUMN     "commitment_level" TEXT,
ADD COLUMN     "cooking_preference" TEXT,
ADD COLUMN     "daily_cooking_time" TEXT,
ADD COLUMN     "daily_food_budget" DOUBLE PRECISION,
ADD COLUMN     "dietary_style" TEXT,
ADD COLUMN     "disliked_foods" TEXT,
ADD COLUMN     "fasting_hours" TEXT,
ADD COLUMN     "fitness_device_type" TEXT,
ADD COLUMN     "food_related_medical_issues" TEXT,
ADD COLUMN     "functional_issues" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "health_goals" TEXT,
ADD COLUMN     "height_cm" DOUBLE PRECISION,
ADD COLUMN     "intermittent_fasting" BOOLEAN,
ADD COLUMN     "kosher" BOOLEAN,
ADD COLUMN     "liked_foods" TEXT,
ADD COLUMN     "main_goal_text" TEXT,
ADD COLUMN     "meal_times" TEXT,
ADD COLUMN     "medical_conditions_text" TEXT,
ADD COLUMN     "most_important_outcome" TEXT,
ADD COLUMN     "past_diet_difficulties" TEXT,
ADD COLUMN     "shopping_method" TEXT,
ADD COLUMN     "snacks_between_meals" BOOLEAN,
ADD COLUMN     "special_personal_goal" TEXT,
ADD COLUMN     "target_weight_kg" DOUBLE PRECISION,
ADD COLUMN     "uses_fitness_devices" BOOLEAN,
ADD COLUMN     "weight_kg" DOUBLE PRECISION,
ADD COLUMN     "workout_times" TEXT,
ALTER COLUMN "program_duration" DROP NOT NULL,
ALTER COLUMN "upload_frequency" DROP NOT NULL,
ALTER COLUMN "notifications_preference" DROP NOT NULL,
ALTER COLUMN "smoking_status" DROP NOT NULL;
