/*
  Warnings:

  - The `upload_frequency` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserQuestionnaire" DROP COLUMN "upload_frequency",
ADD COLUMN     "upload_frequency" TEXT;

-- DropEnum
DROP TYPE "UploadFrequency";
