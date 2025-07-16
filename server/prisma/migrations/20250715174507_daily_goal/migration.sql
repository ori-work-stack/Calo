-- CreateTable
CREATE TABLE "DailyGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "protein_g" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "carbs_g" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "fats_g" DOUBLE PRECISION NOT NULL DEFAULT 67,
    "fiber_g" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "sodium_mg" DOUBLE PRECISION NOT NULL DEFAULT 2300,
    "sugar_g" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "water_ml" DOUBLE PRECISION NOT NULL DEFAULT 2500,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyGoal_user_id_date_idx" ON "DailyGoal"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGoal_user_id_date_key" ON "DailyGoal"("user_id", "date");

-- AddForeignKey
ALTER TABLE "DailyGoal" ADD CONSTRAINT "DailyGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
