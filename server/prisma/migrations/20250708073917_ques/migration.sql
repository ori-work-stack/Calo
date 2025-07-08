/*
  Warnings:

  - Changed the type of `quantity` on the `recommended_ingredients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `unit` on table `recommended_ingredients` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserQuestionnaire" DROP CONSTRAINT "UserQuestionnaire_user_id_fkey";

-- AlterTable
ALTER TABLE "recommended_ingredients" ADD COLUMN     "category" TEXT,
ADD COLUMN     "estimated_cost" DOUBLE PRECISION,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "unit" SET NOT NULL;

-- AlterTable
ALTER TABLE "recommended_meals" ADD COLUMN     "cooking_method" TEXT,
ADD COLUMN     "day_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "fiber" DOUBLE PRECISION,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "prep_time_minutes" INTEGER,
ALTER COLUMN "calories" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "protein" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "carbs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "fat" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "recommended_menus" ADD COLUMN     "days_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "dietary_category" TEXT,
ADD COLUMN     "difficulty_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "estimated_cost" DOUBLE PRECISION,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prep_time_minutes" INTEGER,
ADD COLUMN     "total_fiber" DOUBLE PRECISION,
ALTER COLUMN "total_calories" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_protein" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_carbs" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_fat" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "recommended_meals_day_number_meal_type_idx" ON "recommended_meals"("day_number", "meal_type");

-- CreateIndex
CREATE INDEX "recommended_menus_dietary_category_idx" ON "recommended_menus"("dietary_category");

-- AddForeignKey
ALTER TABLE "UserQuestionnaire" ADD CONSTRAINT "UserQuestionnaire_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
