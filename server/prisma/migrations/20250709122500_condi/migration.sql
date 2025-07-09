/*
  Warnings:

  - You are about to drop the column `name` on the `FoodProduct` table. All the data in the column will be lost.
  - Added the required column `product_name` to the `FoodProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodProduct" DROP COLUMN "name",
ADD COLUMN     "product_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3);
