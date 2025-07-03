-- CreateEnum
CREATE TYPE "MealPlanType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "MealTiming" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'MORNING_SNACK', 'AFTERNOON_SNACK');

-- CreateEnum
CREATE TYPE "DietaryCategory" AS ENUM ('VEGETARIAN', 'VEGAN', 'KETO', 'PALEO', 'MEDITERRANEAN', 'LOW_CARB', 'HIGH_PROTEIN', 'GLUTEN_FREE', 'DAIRY_FREE', 'BALANCED');

-- CreateTable
CREATE TABLE "meal_templates" (
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meal_timing" "MealTiming" NOT NULL,
    "dietary_category" "DietaryCategory" NOT NULL,
    "prep_time_minutes" INTEGER,
    "difficulty_level" INTEGER DEFAULT 1,
    "calories" DOUBLE PRECISION,
    "protein_g" DOUBLE PRECISION,
    "carbs_g" DOUBLE PRECISION,
    "fats_g" DOUBLE PRECISION,
    "fiber_g" DOUBLE PRECISION,
    "sugar_g" DOUBLE PRECISION,
    "sodium_mg" DOUBLE PRECISION,
    "ingredients_json" JSONB,
    "instructions_json" JSONB,
    "allergens_json" JSONB,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_templates_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "user_meal_plans" (
    "plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_type" "MealPlanType" NOT NULL,
    "meals_per_day" INTEGER NOT NULL DEFAULT 3,
    "snacks_per_day" INTEGER NOT NULL DEFAULT 0,
    "rotation_frequency_days" INTEGER NOT NULL DEFAULT 7,
    "include_leftovers" BOOLEAN NOT NULL DEFAULT false,
    "fixed_meal_times" BOOLEAN NOT NULL DEFAULT false,
    "target_calories_daily" DOUBLE PRECISION,
    "target_protein_daily" DOUBLE PRECISION,
    "target_carbs_daily" DOUBLE PRECISION,
    "target_fats_daily" DOUBLE PRECISION,
    "dietary_preferences" JSONB,
    "excluded_ingredients" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_meal_plans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "meal_plan_schedules" (
    "schedule_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "meal_timing" "MealTiming" NOT NULL,
    "meal_order" INTEGER NOT NULL DEFAULT 1,
    "portion_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "user_meal_preferences" (
    "preference_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "preference_type" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_meal_preferences_pkey" PRIMARY KEY ("preference_id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "list_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "name" TEXT NOT NULL,
    "week_start_date" DATE,
    "items_json" JSONB NOT NULL,
    "total_estimated_cost" DOUBLE PRECISION,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("list_id")
);

-- CreateIndex
CREATE INDEX "meal_templates_dietary_category_idx" ON "meal_templates"("dietary_category");

-- CreateIndex
CREATE INDEX "meal_templates_meal_timing_idx" ON "meal_templates"("meal_timing");

-- CreateIndex
CREATE INDEX "user_meal_plans_user_id_idx" ON "user_meal_plans"("user_id");

-- CreateIndex
CREATE INDEX "meal_plan_schedules_plan_id_idx" ON "meal_plan_schedules"("plan_id");

-- CreateIndex
CREATE INDEX "meal_plan_schedules_day_of_week_meal_timing_idx" ON "meal_plan_schedules"("day_of_week", "meal_timing");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plan_schedules_plan_id_day_of_week_meal_timing_meal_or_key" ON "meal_plan_schedules"("plan_id", "day_of_week", "meal_timing", "meal_order");

-- CreateIndex
CREATE INDEX "user_meal_preferences_user_id_template_id_idx" ON "user_meal_preferences"("user_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_meal_preferences_user_id_template_id_preference_type_key" ON "user_meal_preferences"("user_id", "template_id", "preference_type");

-- CreateIndex
CREATE INDEX "shopping_lists_user_id_idx" ON "shopping_lists"("user_id");

-- AddForeignKey
ALTER TABLE "user_meal_plans" ADD CONSTRAINT "user_meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_schedules" ADD CONSTRAINT "meal_plan_schedules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "user_meal_plans"("plan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_schedules" ADD CONSTRAINT "meal_plan_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "meal_templates"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meal_preferences" ADD CONSTRAINT "user_meal_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meal_preferences" ADD CONSTRAINT "user_meal_preferences_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "meal_templates"("template_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "user_meal_plans"("plan_id") ON DELETE SET NULL ON UPDATE CASCADE;
