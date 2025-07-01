/*
  Warnings:

  - You are about to drop the `food_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nutrition_goals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SmokingStatus" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PhysicalActivityLevel" AS ENUM ('NONE', 'LIGHT', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "SportFrequency" AS ENUM ('NONE', 'ONCE_A_WEEK', 'TWO_TO_THREE', 'FOUR_TO_FIVE', 'MORE_THAN_FIVE');

-- CreateEnum
CREATE TYPE "MainGoal" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_MAINTENANCE', 'WEIGHT_GAIN', 'GENERAL_HEALTH', 'MEDICAL_CONDITION', 'SPORTS_PERFORMANCE');

-- CreateEnum
CREATE TYPE "ProgramDuration" AS ENUM ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "UploadFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NONE');

-- CreateEnum
CREATE TYPE "NotificationsPreference" AS ENUM ('DAILY', 'WEEKLY', 'NONE');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "food_items" DROP CONSTRAINT "food_items_mealId_fkey";

-- DropForeignKey
ALTER TABLE "health_metrics" DROP CONSTRAINT "health_metrics_userId_fkey";

-- DropForeignKey
ALTER TABLE "meals" DROP CONSTRAINT "meals_userId_fkey";

-- DropForeignKey
ALTER TABLE "nutrition_goals" DROP CONSTRAINT "nutrition_goals_userId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropTable
DROP TABLE "food_items";

-- DropTable
DROP TABLE "health_metrics";

-- DropTable
DROP TABLE "meals";

-- DropTable
DROP TABLE "nutrition_goals";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "ActivityLevel";

-- DropEnum
DROP TYPE "MealType";

-- DropEnum
DROP TYPE "MetricType";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "signup_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_type" "SubscriptionType" NOT NULL,
    "subscription_start" TIMESTAMP(3),
    "subscription_end" TIMESTAMP(3),
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "medical_conditions" JSONB,
    "medications" TEXT,
    "allergies" JSONB,
    "family_medical_history" JSONB,
    "smoking_status" "SmokingStatus" NOT NULL,
    "sleep_hours_per_night" DOUBLE PRECISION,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserQuestionnaire" (
    "questionnaire_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_completed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "physical_activity_level" "PhysicalActivityLevel" NOT NULL,
    "sport_frequency" "SportFrequency" NOT NULL,
    "sport_types" JSONB,
    "sport_duration_min" INTEGER,
    "meals_per_day" INTEGER,
    "dietary_preferences" JSONB,
    "avoided_foods" JSONB,
    "regular_drinks" JSONB,
    "meal_texture_preference" TEXT,
    "main_goal" "MainGoal" NOT NULL,
    "specific_goal" TEXT,
    "goal_timeframe_days" INTEGER,
    "program_duration" "ProgramDuration" NOT NULL,
    "meal_timing_restrictions" TEXT,
    "dietary_restrictions" TEXT,
    "willingness_to_follow" BOOLEAN,
    "upcoming_events" TEXT,
    "upload_frequency" "UploadFrequency" NOT NULL,
    "notifications_preference" "NotificationsPreference" NOT NULL,
    "personalized_tips" BOOLEAN,
    "health_metrics_integration" BOOLEAN,

    CONSTRAINT "UserQuestionnaire_pkey" PRIMARY KEY ("questionnaire_id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "meal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "upload_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis_status" "AnalysisStatus" NOT NULL,
    "meal_name" TEXT,
    "calories" DOUBLE PRECISION,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fats_g" DOUBLE PRECISION,
    "saturated_fats_g" DOUBLE PRECISION,
    "polyunsaturated_fats_g" DOUBLE PRECISION,
    "monounsaturated_fats_g" DOUBLE PRECISION,
    "omega_3_g" DOUBLE PRECISION,
    "omega_6_g" DOUBLE PRECISION,
    "fiber_g" DOUBLE PRECISION,
    "soluble_fiber_g" DOUBLE PRECISION,
    "insoluble_fiber_g" DOUBLE PRECISION,
    "sugar_g" DOUBLE PRECISION,
    "cholesterol_mg" DOUBLE PRECISION,
    "sodium_mg" DOUBLE PRECISION,
    "alcohol_g" DOUBLE PRECISION,
    "caffeine_mg" DOUBLE PRECISION,
    "liquids_ml" DOUBLE PRECISION,
    "serving_size_g" DOUBLE PRECISION,
    "allergens_json" JSONB,
    "vitamins_json" JSONB,
    "micronutrients_json" JSONB,
    "glycemic_index" DOUBLE PRECISION,
    "insulin_index" DOUBLE PRECISION,
    "food_category" TEXT,
    "processing_level" TEXT,
    "cooking_method" TEXT,
    "additives_json" JSONB,
    "health_risk_notes" TEXT,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("meal_id")
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "plan_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goal_calories" DOUBLE PRECISION,
    "goal_protein_g" DOUBLE PRECISION,
    "goal_carbs_g" DOUBLE PRECISION,
    "goal_fats_g" DOUBLE PRECISION,
    "target_weight_kg" DOUBLE PRECISION,
    "duration_days" INTEGER,
    "notes" TEXT,

    CONSTRAINT "NutritionPlan_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "payment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_type" "SubscriptionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "AdminDashboard" (
    "record_id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "active_users" INTEGER NOT NULL,
    "paying_users" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "api_calls" INTEGER NOT NULL,
    "marketing_spend" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AdminDashboard_pkey" PRIMARY KEY ("record_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "UserQuestionnaire" ADD CONSTRAINT "UserQuestionnaire_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
