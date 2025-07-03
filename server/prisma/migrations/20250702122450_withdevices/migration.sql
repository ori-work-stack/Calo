/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'SYNCING', 'ERROR');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('APPLE_HEALTH', 'GOOGLE_FIT', 'FITBIT', 'GARMIN', 'WHOOP', 'SAMSUNG_HEALTH', 'POLAR', 'SUUNTO', 'WITHINGS', 'OURA', 'AMAZFIT', 'HUAWEI_HEALTH');

-- DropForeignKey
ALTER TABLE "Meal" DROP CONSTRAINT "Meal_user_id_fkey";

-- DropForeignKey
ALTER TABLE "NutritionPlan" DROP CONSTRAINT "NutritionPlan_user_id_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionPayment" DROP CONSTRAINT "SubscriptionPayment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionnaire" DROP CONSTRAINT "UserQuestionnaire_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "Meal" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "NutritionPlan" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPayment" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "user_id" DROP DEFAULT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");
DROP SEQUENCE "User_user_id_seq";

-- AlterTable
ALTER TABLE "UserQuestionnaire" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "connected_devices" (
    "connected_device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "connection_status" "ConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "last_sync_time" TIMESTAMP(3),
    "sync_frequency_hours" INTEGER DEFAULT 24,
    "is_primary_device" BOOLEAN NOT NULL DEFAULT false,
    "device_settings" JSONB,
    "access_token_encrypted" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_devices_pkey" PRIMARY KEY ("connected_device_id")
);

-- CreateTable
CREATE TABLE "daily_activity_summary" (
    "daily_activity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "steps" INTEGER DEFAULT 0,
    "calories_burned" DOUBLE PRECISION DEFAULT 0,
    "active_minutes" INTEGER DEFAULT 0,
    "bmr_estimate" DOUBLE PRECISION DEFAULT 0,
    "distance_km" DOUBLE PRECISION DEFAULT 0,
    "heart_rate_avg" INTEGER,
    "heart_rate_max" INTEGER,
    "sleep_hours" DOUBLE PRECISION,
    "water_intake_ml" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "body_fat_percentage" DOUBLE PRECISION,
    "source_device" TEXT NOT NULL,
    "sync_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_activity_summary_pkey" PRIMARY KEY ("daily_activity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connected_devices_user_id_device_type_key" ON "connected_devices"("user_id", "device_type");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_summary_user_id_device_id_date_key" ON "daily_activity_summary"("user_id", "device_id", "date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connected_devices" ADD CONSTRAINT "connected_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity_summary" ADD CONSTRAINT "daily_activity_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity_summary" ADD CONSTRAINT "daily_activity_summary_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "connected_devices"("connected_device_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionnaire" ADD CONSTRAINT "UserQuestionnaire_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
