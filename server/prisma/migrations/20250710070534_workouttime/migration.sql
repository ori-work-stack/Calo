/*
  Warnings:

  - The `workout_times` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserQuestionnaire" DROP COLUMN "workout_times",
ADD COLUMN     "workout_times" TEXT[];
