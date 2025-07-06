/*
  Warnings:

  - You are about to drop the column `allergies` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `family_medical_history` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `medical_conditions` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `medications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sleep_hours_per_night` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `smoking_status` on the `User` table. All the data in the column will be lost.
  - Added the required column `smoking_status` to the `UserQuestionnaire` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "allergies",
DROP COLUMN "family_medical_history",
DROP COLUMN "medical_conditions",
DROP COLUMN "medications",
DROP COLUMN "sleep_hours_per_night",
DROP COLUMN "smoking_status",
ADD COLUMN     "ai_requests_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ai_requests_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserQuestionnaire" ADD COLUMN     "allergies" JSONB,
ADD COLUMN     "family_medical_history" JSONB,
ADD COLUMN     "medical_conditions" JSONB,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "sleep_hours_per_night" DOUBLE PRECISION,
ADD COLUMN     "smoking_status" "SmokingStatus" NOT NULL;
