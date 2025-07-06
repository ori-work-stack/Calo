/*
  Warnings:

  - The values [MONTHLY] on the enum `MealPlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MealPlanType_new" AS ENUM ('DAILY', 'WEEKLY', 'THREE_DAYS');
ALTER TABLE "user_meal_plans" ALTER COLUMN "plan_type" TYPE "MealPlanType_new" USING ("plan_type"::text::"MealPlanType_new");
ALTER TYPE "MealPlanType" RENAME TO "MealPlanType_old";
ALTER TYPE "MealPlanType_new" RENAME TO "MealPlanType";
DROP TYPE "MealPlanType_old";
COMMIT;
