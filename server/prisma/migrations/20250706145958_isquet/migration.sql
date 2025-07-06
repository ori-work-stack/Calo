/*
  Warnings:

  - The values [BASIC] on the enum `SubscriptionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionType_new" AS ENUM ('FREE', 'PREMIUM', 'GOLD');
ALTER TABLE "User" ALTER COLUMN "subscription_type" TYPE "SubscriptionType_new" USING ("subscription_type"::text::"SubscriptionType_new");
ALTER TABLE "SubscriptionPayment" ALTER COLUMN "plan_type" TYPE "SubscriptionType_new" USING ("plan_type"::text::"SubscriptionType_new");
ALTER TYPE "SubscriptionType" RENAME TO "SubscriptionType_old";
ALTER TYPE "SubscriptionType_new" RENAME TO "SubscriptionType";
DROP TYPE "SubscriptionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_questionnaire_completed" BOOLEAN NOT NULL DEFAULT false;
