-- AlterTable
ALTER TABLE "Meal" ALTER COLUMN "additives_json" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "ChatMessage" (
    "message_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_message" TEXT NOT NULL,
    "ai_response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "recommended_menus" (
    "menu_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "total_calories" INTEGER NOT NULL,
    "total_protein" INTEGER NOT NULL,
    "total_carbs" INTEGER NOT NULL,
    "total_fat" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommended_menus_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "recommended_meals" (
    "meal_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal_type" "MealTiming" NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL,
    "carbs" INTEGER NOT NULL,
    "fat" INTEGER NOT NULL,

    CONSTRAINT "recommended_meals_pkey" PRIMARY KEY ("meal_id")
);

-- CreateTable
CREATE TABLE "recommended_ingredients" (
    "ingredient_id" TEXT NOT NULL,
    "meal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit" TEXT,

    CONSTRAINT "recommended_ingredients_pkey" PRIMARY KEY ("ingredient_id")
);

-- CreateTable
CREATE TABLE "scanned_products" (
    "scan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "barcode" TEXT,
    "product_name" TEXT NOT NULL,
    "brand" TEXT,
    "nutrition_data" JSONB NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanned_products_pkey" PRIMARY KEY ("scan_id")
);

-- CreateTable
CREATE TABLE "FoodProduct" (
    "product_id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "nutrition_per_100g" JSONB NOT NULL,
    "ingredients" JSONB NOT NULL,
    "allergens" JSONB NOT NULL,
    "labels" JSONB NOT NULL,
    "health_score" INTEGER,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodProduct_pkey" PRIMARY KEY ("product_id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_user_id_created_at_idx" ON "ChatMessage"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "recommended_menus_user_id_idx" ON "recommended_menus"("user_id");

-- CreateIndex
CREATE INDEX "recommended_meals_menu_id_idx" ON "recommended_meals"("menu_id");

-- CreateIndex
CREATE INDEX "recommended_ingredients_meal_id_idx" ON "recommended_ingredients"("meal_id");

-- CreateIndex
CREATE INDEX "scanned_products_user_id_idx" ON "scanned_products"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FoodProduct_barcode_key" ON "FoodProduct"("barcode");

-- CreateIndex
CREATE INDEX "FoodProduct_category_idx" ON "FoodProduct"("category");

-- CreateIndex
CREATE INDEX "FoodProduct_barcode_idx" ON "FoodProduct"("barcode");

-- AddForeignKey
ALTER TABLE "recommended_menus" ADD CONSTRAINT "recommended_menus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_meals" ADD CONSTRAINT "recommended_meals_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "recommended_menus"("menu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_ingredients" ADD CONSTRAINT "recommended_ingredients_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "recommended_meals"("meal_id") ON DELETE CASCADE ON UPDATE CASCADE;
