/*
  Warnings:

  - The `sport_types` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `regular_drinks` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `meal_texture_preference` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `specific_goal` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dietary_restrictions` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `upcoming_events` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `family_medical_history` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medical_conditions` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medications` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `additional_activity_info` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `additional_personal_info` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `allergies_text` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `available_cooking_methods` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `disliked_foods` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fitness_device_type` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `food_related_medical_issues` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `functional_issues` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `health_goals` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `liked_foods` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `main_goal_text` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medical_conditions_text` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `most_important_outcome` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `past_diet_difficulties` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shopping_method` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `special_personal_goal` column on the `UserQuestionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserQuestionnaire" DROP COLUMN "sport_types",
ADD COLUMN     "sport_types" TEXT[],
DROP COLUMN "regular_drinks",
ADD COLUMN     "regular_drinks" TEXT[],
DROP COLUMN "meal_texture_preference",
ADD COLUMN     "meal_texture_preference" TEXT[],
DROP COLUMN "specific_goal",
ADD COLUMN     "specific_goal" TEXT[],
DROP COLUMN "dietary_restrictions",
ADD COLUMN     "dietary_restrictions" TEXT[],
DROP COLUMN "upcoming_events",
ADD COLUMN     "upcoming_events" TEXT[],
DROP COLUMN "allergies",
ADD COLUMN     "allergies" TEXT[],
DROP COLUMN "family_medical_history",
ADD COLUMN     "family_medical_history" TEXT[],
DROP COLUMN "medical_conditions",
ADD COLUMN     "medical_conditions" TEXT[],
DROP COLUMN "medications",
ADD COLUMN     "medications" TEXT[],
DROP COLUMN "additional_activity_info",
ADD COLUMN     "additional_activity_info" TEXT[],
DROP COLUMN "additional_personal_info",
ADD COLUMN     "additional_personal_info" TEXT[],
DROP COLUMN "allergies_text",
ADD COLUMN     "allergies_text" TEXT[],
DROP COLUMN "available_cooking_methods",
ADD COLUMN     "available_cooking_methods" TEXT[],
DROP COLUMN "disliked_foods",
ADD COLUMN     "disliked_foods" TEXT[],
DROP COLUMN "fitness_device_type",
ADD COLUMN     "fitness_device_type" TEXT[],
DROP COLUMN "food_related_medical_issues",
ADD COLUMN     "food_related_medical_issues" TEXT[],
DROP COLUMN "functional_issues",
ADD COLUMN     "functional_issues" TEXT[],
DROP COLUMN "health_goals",
ADD COLUMN     "health_goals" TEXT[],
DROP COLUMN "liked_foods",
ADD COLUMN     "liked_foods" TEXT[],
DROP COLUMN "main_goal_text",
ADD COLUMN     "main_goal_text" TEXT[],
DROP COLUMN "medical_conditions_text",
ADD COLUMN     "medical_conditions_text" TEXT[],
DROP COLUMN "most_important_outcome",
ADD COLUMN     "most_important_outcome" TEXT[],
DROP COLUMN "past_diet_difficulties",
ADD COLUMN     "past_diet_difficulties" TEXT[],
DROP COLUMN "shopping_method",
ADD COLUMN     "shopping_method" TEXT[],
DROP COLUMN "special_personal_goal",
ADD COLUMN     "special_personal_goal" TEXT[];
