/*
  Warnings:

  - The values [UNKNOWN] on the enum `SmokingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `AdminDashboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scanned_products` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `meals_per_day` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commitment_level` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cooking_preference` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dietary_style` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `height_cm` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kosher` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `snacks_between_meals` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uses_fitness_devices` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight_kg` on table `UserQuestionnaire` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SmokingStatus_new" AS ENUM ('YES', 'NO');
ALTER TABLE "UserQuestionnaire" ALTER COLUMN "smoking_status" TYPE "SmokingStatus_new" USING ("smoking_status"::text::"SmokingStatus_new");
ALTER TYPE "SmokingStatus" RENAME TO "SmokingStatus_old";
ALTER TYPE "SmokingStatus_new" RENAME TO "SmokingStatus";
DROP TYPE "SmokingStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Meal" DROP CONSTRAINT "Meal_user_id_fkey";

-- AlterTable
ALTER TABLE "FoodProduct" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verification_code" TEXT,
ADD COLUMN     "email_verification_expires" TIMESTAMP(3),
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserQuestionnaire" ALTER COLUMN "meals_per_day" SET NOT NULL,
ALTER COLUMN "meals_per_day" SET DEFAULT 3,
ALTER COLUMN "commitment_level" SET NOT NULL,
ALTER COLUMN "cooking_preference" SET NOT NULL,
ALTER COLUMN "dietary_style" SET NOT NULL,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "height_cm" SET NOT NULL,
ALTER COLUMN "kosher" SET NOT NULL,
ALTER COLUMN "kosher" SET DEFAULT false,
ALTER COLUMN "snacks_between_meals" SET NOT NULL,
ALTER COLUMN "snacks_between_meals" SET DEFAULT false,
ALTER COLUMN "uses_fitness_devices" SET NOT NULL,
ALTER COLUMN "uses_fitness_devices" SET DEFAULT false,
ALTER COLUMN "weight_kg" SET NOT NULL;

-- DropTable
DROP TABLE "AdminDashboard";

-- DropTable
DROP TABLE "scanned_products";

-- CreateIndex
CREATE INDEX "FoodProduct_user_id_idx" ON "FoodProduct"("user_id");

-- CreateIndex
CREATE INDEX "Meal_user_id_created_at_idx" ON "Meal"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Meal_analysis_status_idx" ON "Meal"("analysis_status");

-- CreateIndex
CREATE INDEX "Meal_upload_time_idx" ON "Meal"("upload_time");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodProduct" ADD CONSTRAINT "FoodProduct_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
