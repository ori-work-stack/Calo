"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealPlanService = void 0;
const database_1 = require("../lib/database");
const openai_1 = require("./openai");
class MealPlanService {
    static async createUserMealPlan(user_id, config) {
        try {
            console.log("🍽️ Creating AI-powered meal plan for user:", user_id);
            // Get user's questionnaire data for personalization
            const questionnaire = await database_1.prisma.userQuestionnaire.findFirst({
                where: { user_id },
                orderBy: { date_completed: "desc" },
            });
            // Get user's nutrition goals
            const nutritionPlan = await database_1.prisma.nutritionPlan.findFirst({
                where: { user_id },
                orderBy: { created_at: "desc" },
            });
            // Get user's basic info
            const user = await database_1.prisma.user.findUnique({
                where: { user_id },
                select: {
                    age: true,
                    weight_kg: true,
                    height_cm: true,
                },
            });
            // Generate AI meal plan
            const aiMealPlan = await this.generateAIMealPlan(config, questionnaire, nutritionPlan, user);
            // Validate AI response
            if (!aiMealPlan ||
                !aiMealPlan.weekly_plan ||
                !Array.isArray(aiMealPlan.weekly_plan)) {
                throw new Error("Invalid AI meal plan response structure");
            }
            // Create the meal plan
            const mealPlan = await database_1.prisma.userMealPlan.create({
                data: {
                    user_id,
                    name: config.name,
                    plan_type: "WEEKLY",
                    meals_per_day: config.meals_per_day,
                    snacks_per_day: config.snacks_per_day,
                    rotation_frequency_days: config.rotation_frequency_days,
                    include_leftovers: config.include_leftovers,
                    fixed_meal_times: config.fixed_meal_times,
                    target_calories_daily: nutritionPlan?.goal_calories || 2000,
                    target_protein_daily: nutritionPlan?.goal_protein_g || 150,
                    target_carbs_daily: nutritionPlan?.goal_carbs_g || 250,
                    target_fats_daily: nutritionPlan?.goal_fats_g || 67,
                    dietary_preferences: config.dietary_preferences,
                    excluded_ingredients: config.excluded_ingredients,
                    start_date: new Date(),
                    is_active: true,
                },
            });
            // Store AI-generated meal templates and create schedule
            await this.storeAIMealTemplatesAndSchedule(mealPlan.plan_id, aiMealPlan);
            console.log("✅ AI meal plan created successfully");
            return mealPlan;
        }
        catch (error) {
            console.error("💥 Error creating AI meal plan:", error);
            throw new Error(`Failed to create meal plan: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    static async generateAIMealPlan(config, questionnaire, nutritionPlan, user) {
        try {
            console.log("🤖 Generating AI meal plan...");
            // Build user profile for AI
            const userProfile = this.buildUserProfile(config, questionnaire, nutritionPlan, user);
            // Generate meal plan using OpenAI
            const aiResponse = await openai_1.OpenAIService.generateMealPlan(userProfile);
            // Validate and structure the response
            const structuredResponse = this.validateAndStructureAIResponse(aiResponse);
            console.log("✅ AI meal plan generated successfully");
            return structuredResponse;
        }
        catch (error) {
            console.error("💥 Error generating AI meal plan:", error);
            // Return fallback meal plan if AI fails
            return this.generateFallbackMealPlan(config);
        }
    }
    static validateAndStructureAIResponse(aiResponse) {
        try {
            // If response is a string, try to parse it
            if (typeof aiResponse === "string") {
                aiResponse = JSON.parse(aiResponse);
            }
            // Check if response has the expected structure
            if (!aiResponse || !aiResponse.weekly_plan) {
                throw new Error("Missing weekly_plan in AI response");
            }
            // Validate each day's meals
            const validatedWeeklyPlan = aiResponse.weekly_plan.map((dayPlan, index) => {
                if (!dayPlan.meals || !Array.isArray(dayPlan.meals)) {
                    throw new Error(`Day ${index} missing meals array`);
                }
                const validatedMeals = dayPlan.meals.map((meal) => {
                    return {
                        name: meal.name || `Meal ${index + 1}`,
                        description: meal.description || null,
                        meal_timing: meal.meal_timing || "BREAKFAST",
                        dietary_category: meal.dietary_category || "BALANCED",
                        prep_time_minutes: meal.prep_time_minutes || 30,
                        difficulty_level: meal.difficulty_level || 2,
                        calories: meal.calories || 400,
                        protein_g: meal.protein_g || 20,
                        carbs_g: meal.carbs_g || 40,
                        fats_g: meal.fats_g || 15,
                        fiber_g: meal.fiber_g || 5,
                        sugar_g: meal.sugar_g || 10,
                        sodium_mg: meal.sodium_mg || 500,
                        ingredients: Array.isArray(meal.ingredients)
                            ? meal.ingredients
                            : [],
                        instructions: Array.isArray(meal.instructions)
                            ? meal.instructions
                            : [],
                        allergens: Array.isArray(meal.allergens) ? meal.allergens : [],
                        image_url: meal.image_url || null,
                        portion_multiplier: meal.portion_multiplier || 1.0,
                        is_optional: meal.is_optional || false,
                    };
                });
                return {
                    day: dayPlan.day || `Day ${index + 1}`,
                    meals: validatedMeals,
                };
            });
            return {
                weekly_plan: validatedWeeklyPlan,
            };
        }
        catch (error) {
            console.error("Error validating AI response:", error);
            throw new Error("Invalid AI response structure");
        }
    }
    static generateFallbackMealPlan(config) {
        console.log("🔄 Generating fallback meal plan...");
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const mealTimings = ["BREAKFAST", "LUNCH", "DINNER"];
        const fallbackMeals = [
            {
                name: "Scrambled Eggs with Toast",
                description: "Classic breakfast with protein and carbs",
                meal_timing: "BREAKFAST",
                dietary_category: "BALANCED",
                prep_time_minutes: 15,
                difficulty_level: 1,
                calories: 350,
                protein_g: 18,
                carbs_g: 25,
                fats_g: 18,
                fiber_g: 3,
                sugar_g: 4,
                sodium_mg: 450,
                ingredients: [
                    { name: "eggs", quantity: 2, unit: "piece", category: "Protein" },
                    { name: "bread", quantity: 2, unit: "slice", category: "Grains" },
                    { name: "butter", quantity: 1, unit: "tbsp", category: "Fats" },
                ],
                instructions: [
                    "Heat butter in pan",
                    "Scramble eggs",
                    "Toast bread",
                    "Serve together",
                ],
                allergens: ["eggs", "gluten"],
                image_url: null,
                portion_multiplier: 1.0,
                is_optional: false,
            },
            {
                name: "Grilled Chicken Salad",
                description: "Healthy lunch with lean protein and vegetables",
                meal_timing: "LUNCH",
                dietary_category: "BALANCED",
                prep_time_minutes: 25,
                difficulty_level: 2,
                calories: 400,
                protein_g: 35,
                carbs_g: 15,
                fats_g: 20,
                fiber_g: 8,
                sugar_g: 8,
                sodium_mg: 600,
                ingredients: [
                    {
                        name: "chicken breast",
                        quantity: 150,
                        unit: "g",
                        category: "Protein",
                    },
                    {
                        name: "mixed greens",
                        quantity: 100,
                        unit: "g",
                        category: "Vegetables",
                    },
                    { name: "olive oil", quantity: 2, unit: "tbsp", category: "Fats" },
                ],
                instructions: [
                    "Grill chicken breast",
                    "Prepare salad",
                    "Add dressing",
                    "Combine and serve",
                ],
                allergens: [],
                image_url: null,
                portion_multiplier: 1.0,
                is_optional: false,
            },
            {
                name: "Baked Salmon with Rice",
                description: "Nutritious dinner with omega-3 rich fish",
                meal_timing: "DINNER",
                dietary_category: "BALANCED",
                prep_time_minutes: 30,
                difficulty_level: 2,
                calories: 500,
                protein_g: 35,
                carbs_g: 45,
                fats_g: 18,
                fiber_g: 2,
                sugar_g: 2,
                sodium_mg: 400,
                ingredients: [
                    {
                        name: "salmon fillet",
                        quantity: 150,
                        unit: "g",
                        category: "Protein",
                    },
                    { name: "brown rice", quantity: 80, unit: "g", category: "Grains" },
                    {
                        name: "broccoli",
                        quantity: 100,
                        unit: "g",
                        category: "Vegetables",
                    },
                ],
                instructions: [
                    "Bake salmon at 400°F for 15 minutes",
                    "Cook rice according to package",
                    "Steam broccoli",
                    "Serve together",
                ],
                allergens: ["fish"],
                image_url: null,
                portion_multiplier: 1.0,
                is_optional: false,
            },
        ];
        return {
            weekly_plan: days.map((day, dayIndex) => ({
                day,
                meals: mealTimings
                    .slice(0, config.meals_per_day)
                    .map((timing, mealIndex) => {
                    const baseMeal = fallbackMeals.find((m) => m.meal_timing === timing) ||
                        fallbackMeals[0];
                    return {
                        ...baseMeal,
                        name: `${baseMeal.name} - ${day}`,
                        meal_timing: timing,
                        image_url: baseMeal.image_url || undefined,
                    };
                }),
            })),
        };
    }
    static buildUserProfile(config, questionnaire, nutritionPlan, user) {
        return {
            // Basic info
            age: user?.age || 30,
            weight_kg: user?.weight_kg || 70,
            height_cm: user?.height_cm || 170,
            // Nutrition goals
            target_calories_daily: nutritionPlan?.goal_calories || 2000,
            target_protein_daily: nutritionPlan?.goal_protein_g || 150,
            target_carbs_daily: nutritionPlan?.goal_carbs_g || 250,
            target_fats_daily: nutritionPlan?.goal_fats_g || 67,
            // Meal structure preferences
            meals_per_day: config.meals_per_day,
            snacks_per_day: config.snacks_per_day,
            rotation_frequency_days: config.rotation_frequency_days,
            include_leftovers: config.include_leftovers,
            fixed_meal_times: config.fixed_meal_times,
            // Dietary preferences and restrictions
            dietary_preferences: config.dietary_preferences || [],
            excluded_ingredients: config.excluded_ingredients || [],
            allergies: Array.isArray(questionnaire?.allergies)
                ? questionnaire.allergies
                : [],
            // Lifestyle factors
            physical_activity_level: questionnaire?.physical_activity_level || "MODERATE",
            sport_frequency: questionnaire?.sport_frequency || "TWO_TO_THREE",
            main_goal: questionnaire?.main_goal || "GENERAL_HEALTH",
            // Food preferences from questionnaire
            dietary_preferences_questionnaire: Array.isArray(questionnaire?.dietary_preferences)
                ? questionnaire.dietary_preferences
                : [],
            avoided_foods: Array.isArray(questionnaire?.avoided_foods)
                ? questionnaire.avoided_foods
                : [],
            meal_texture_preference: questionnaire?.meal_texture_preference || "VARIED",
            // Cooking preferences
            cooking_skill_level: "intermediate",
            available_cooking_time: this.getCookingTimeFromMealCount(config.meals_per_day),
            kitchen_equipment: ["oven", "stovetop", "microwave"],
        };
    }
    static async storeAIMealTemplatesAndSchedule(plan_id, aiMealPlan) {
        try {
            console.log("💾 Storing AI-generated meal templates and schedule...");
            const templateIds = {};
            // Store each unique meal template
            for (const dayPlan of aiMealPlan.weekly_plan) {
                for (const meal of dayPlan.meals) {
                    const templateKey = `${meal.name}-${meal.meal_timing}`;
                    if (!templateIds[templateKey]) {
                        try {
                            const template = await database_1.prisma.mealTemplate.create({
                                data: {
                                    name: meal.name,
                                    description: meal.description,
                                    meal_timing: meal.meal_timing,
                                    dietary_category: meal.dietary_category,
                                    prep_time_minutes: meal.prep_time_minutes,
                                    difficulty_level: meal.difficulty_level,
                                    calories: meal.calories,
                                    protein_g: meal.protein_g,
                                    carbs_g: meal.carbs_g,
                                    fats_g: meal.fats_g,
                                    fiber_g: meal.fiber_g,
                                    sugar_g: meal.sugar_g,
                                    sodium_mg: meal.sodium_mg,
                                    ingredients_json: meal.ingredients,
                                    instructions_json: meal.instructions,
                                    allergens_json: meal.allergens,
                                    image_url: meal.image_url,
                                },
                            });
                            templateIds[templateKey] = template.template_id;
                        }
                        catch (error) {
                            console.error(`Error creating template for ${meal.name}:`, error);
                            // Continue with other meals
                        }
                    }
                }
            }
            // Create meal schedule
            for (let dayIndex = 0; dayIndex < aiMealPlan.weekly_plan.length; dayIndex++) {
                const dayPlan = aiMealPlan.weekly_plan[dayIndex];
                for (let mealIndex = 0; mealIndex < dayPlan.meals.length; mealIndex++) {
                    const meal = dayPlan.meals[mealIndex];
                    const templateKey = `${meal.name}-${meal.meal_timing}`;
                    if (templateIds[templateKey]) {
                        try {
                            await database_1.prisma.mealPlanSchedule.create({
                                data: {
                                    plan_id,
                                    template_id: templateIds[templateKey],
                                    day_of_week: dayIndex,
                                    meal_timing: meal.meal_timing,
                                    meal_order: mealIndex + 1,
                                    portion_multiplier: meal.portion_multiplier || 1.0,
                                    is_optional: meal.is_optional || false,
                                },
                            });
                        }
                        catch (error) {
                            console.error(`Error creating schedule for ${meal.name}:`, error);
                            // Continue with other meals
                        }
                    }
                }
            }
            console.log("✅ AI meal templates and schedule stored successfully");
        }
        catch (error) {
            console.error("💥 Error storing AI meal templates:", error);
            throw error;
        }
    }
    static async getUserMealPlan(user_id, plan_id) {
        try {
            console.log("📋 Getting meal plan for user:", user_id);
            // Get the active meal plan or specific plan
            const mealPlan = await database_1.prisma.userMealPlan.findFirst({
                where: {
                    user_id,
                    ...(plan_id ? { plan_id } : { is_active: true }),
                },
                include: {
                    schedules: {
                        include: {
                            template: true,
                        },
                        orderBy: [
                            { day_of_week: "asc" },
                            { meal_timing: "asc" },
                            { meal_order: "asc" },
                        ],
                    },
                },
            });
            if (!mealPlan) {
                throw new Error("No active meal plan found");
            }
            // Organize by day and meal timing
            const weeklyPlan = {};
            const dayNames = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            for (let day = 0; day < 7; day++) {
                const dayName = dayNames[day];
                weeklyPlan[dayName] = {};
                const daySchedules = mealPlan.schedules.filter((s) => s.day_of_week === day);
                // Group by meal timing
                const timingGroups = daySchedules.reduce((acc, schedule) => {
                    const timing = schedule.meal_timing;
                    if (!acc[timing])
                        acc[timing] = [];
                    acc[timing].push({
                        template_id: schedule.template.template_id,
                        name: schedule.template.name,
                        description: schedule.template.description,
                        meal_timing: schedule.template.meal_timing,
                        dietary_category: schedule.template.dietary_category,
                        prep_time_minutes: schedule.template.prep_time_minutes,
                        difficulty_level: schedule.template.difficulty_level,
                        calories: Math.round((schedule.template.calories || 0) * schedule.portion_multiplier),
                        protein_g: Math.round((schedule.template.protein_g || 0) *
                            schedule.portion_multiplier *
                            10) / 10,
                        carbs_g: Math.round((schedule.template.carbs_g || 0) *
                            schedule.portion_multiplier *
                            10) / 10,
                        fats_g: Math.round((schedule.template.fats_g || 0) *
                            schedule.portion_multiplier *
                            10) / 10,
                        fiber_g: Math.round((schedule.template.fiber_g || 0) *
                            schedule.portion_multiplier *
                            10) / 10,
                        sugar_g: Math.round((schedule.template.sugar_g || 0) *
                            schedule.portion_multiplier *
                            10) / 10,
                        sodium_mg: Math.round((schedule.template.sodium_mg || 0) * schedule.portion_multiplier),
                        ingredients: schedule.template.ingredients_json || [],
                        instructions: schedule.template.instructions_json || [],
                        allergens: schedule.template.allergens_json || [],
                        image_url: schedule.template.image_url,
                    });
                    return acc;
                }, {});
                weeklyPlan[dayName] = timingGroups;
            }
            console.log("✅ Meal plan retrieved successfully");
            return weeklyPlan;
        }
        catch (error) {
            console.error("💥 Error getting meal plan:", error);
            throw error;
        }
    }
    static async replaceMealInPlan(user_id, plan_id, day_of_week, meal_timing, meal_order, preferences) {
        try {
            console.log("🔄 AI-powered meal replacement in plan:", {
                plan_id,
                day_of_week,
                meal_timing,
                meal_order,
            });
            // Verify the plan belongs to the user
            const mealPlan = await database_1.prisma.userMealPlan.findFirst({
                where: { plan_id, user_id },
                include: {
                    schedules: {
                        where: {
                            day_of_week,
                            meal_timing: meal_timing,
                            meal_order,
                        },
                        include: {
                            template: true,
                        },
                    },
                },
            });
            if (!mealPlan || !mealPlan.schedules[0]) {
                throw new Error("Meal not found in plan");
            }
            const currentMeal = mealPlan.schedules[0].template;
            // Get user profile for AI replacement
            const questionnaire = await database_1.prisma.userQuestionnaire.findFirst({
                where: { user_id },
                orderBy: { date_completed: "desc" },
            });
            const user = await database_1.prisma.user.findUnique({
                where: { user_id },
                select: { age: true, weight_kg: true, height_cm: true },
            });
            // Generate AI replacement meal
            const replacementMeal = await openai_1.OpenAIService.generateReplacementMeal({
                current_meal: {
                    name: currentMeal.name,
                    meal_timing: currentMeal.meal_timing,
                    dietary_category: currentMeal.dietary_category,
                    calories: Number(currentMeal.calories) || 0,
                    protein_g: Number(currentMeal.protein_g) || 0,
                    carbs_g: Number(currentMeal.carbs_g) || 0,
                    fats_g: Number(currentMeal.fats_g) || 0,
                },
                user_preferences: {
                    dietary_preferences: mealPlan.dietary_preferences || [],
                    excluded_ingredients: mealPlan.excluded_ingredients || [],
                    allergies: Array.isArray(questionnaire?.allergies)
                        ? questionnaire.allergies
                        : [],
                    preferred_dietary_category: preferences?.dietary_category,
                    max_prep_time: preferences?.max_prep_time,
                },
                nutrition_targets: {
                    target_calories: mealPlan.target_calories_daily || 2000,
                    target_protein: mealPlan.target_protein_daily || 150,
                },
            });
            // Create new template for replacement meal
            const newTemplate = await database_1.prisma.mealTemplate.create({
                data: {
                    name: replacementMeal.name,
                    description: replacementMeal.description,
                    meal_timing: replacementMeal.meal_timing,
                    dietary_category: replacementMeal.dietary_category,
                    prep_time_minutes: replacementMeal.prep_time_minutes,
                    difficulty_level: replacementMeal.difficulty_level,
                    calories: replacementMeal.calories,
                    protein_g: replacementMeal.protein_g,
                    carbs_g: replacementMeal.carbs_g,
                    fats_g: replacementMeal.fats_g,
                    fiber_g: replacementMeal.fiber_g,
                    sugar_g: replacementMeal.sugar_g,
                    sodium_mg: replacementMeal.sodium_mg,
                    ingredients_json: replacementMeal.ingredients,
                    instructions_json: replacementMeal.instructions,
                    allergens_json: replacementMeal.allergens,
                    image_url: replacementMeal.image_url,
                },
            });
            // Update the schedule
            await database_1.prisma.mealPlanSchedule.updateMany({
                where: {
                    plan_id,
                    day_of_week,
                    meal_timing: meal_timing,
                    meal_order,
                },
                data: {
                    template_id: newTemplate.template_id,
                },
            });
            console.log("✅ AI meal replacement completed successfully");
            return { success: true, new_meal: newTemplate };
        }
        catch (error) {
            console.error("💥 Error replacing meal with AI:", error);
            throw error;
        }
    }
    static async generateShoppingList(user_id, plan_id, week_start_date) {
        try {
            console.log("🛒 Generating shopping list for plan:", plan_id);
            const mealPlan = await database_1.prisma.userMealPlan.findFirst({
                where: { plan_id, user_id },
                include: {
                    schedules: {
                        include: {
                            template: true,
                        },
                    },
                },
            });
            if (!mealPlan) {
                throw new Error("Meal plan not found");
            }
            // Aggregate ingredients from all meals
            const ingredientMap = new Map();
            mealPlan.schedules.forEach((schedule) => {
                const ingredients = schedule.template.ingredients_json || [];
                ingredients.forEach((ingredient) => {
                    const key = ingredient.name?.toLowerCase() || "unknown";
                    const existing = ingredientMap.get(key);
                    const quantity = (ingredient.quantity || 1) * schedule.portion_multiplier;
                    const unit = ingredient.unit || "piece";
                    const category = ingredient.category || "Other";
                    if (existing && existing.unit === unit) {
                        existing.quantity += quantity;
                    }
                    else {
                        ingredientMap.set(key, {
                            quantity,
                            unit,
                            category,
                        });
                    }
                });
            });
            // Convert to shopping list format
            const shoppingItems = Array.from(ingredientMap.entries()).map(([name, details]) => ({
                name,
                quantity: Math.ceil(details.quantity * 100) / 100, // Round to 2 decimal places
                unit: details.unit,
                category: details.category,
                estimated_cost: this.estimateIngredientCost(name, details.quantity, details.unit),
                is_purchased: false,
            }));
            // Group by category
            const groupedItems = shoppingItems.reduce((acc, item) => {
                if (!acc[item.category])
                    acc[item.category] = [];
                acc[item.category].push(item);
                return acc;
            }, {});
            // Calculate total estimated cost
            const totalCost = Math.round(shoppingItems.reduce((sum, item) => sum + item.estimated_cost, 0) *
                100) / 100;
            // Create shopping list
            const shoppingList = await database_1.prisma.shoppingList.create({
                data: {
                    user_id,
                    plan_id,
                    name: `Shopping List - Week of ${week_start_date}`,
                    week_start_date: new Date(week_start_date),
                    items_json: groupedItems,
                    total_estimated_cost: totalCost,
                },
            });
            console.log("✅ Shopping list generated successfully");
            return shoppingList;
        }
        catch (error) {
            console.error("💥 Error generating shopping list:", error);
            throw error;
        }
    }
    static async saveMealPreference(user_id, template_id, preference_type, rating, notes) {
        try {
            console.log("💝 Saving meal preference:", {
                template_id,
                preference_type,
                rating,
            });
            const preference = await database_1.prisma.userMealPreference.upsert({
                where: {
                    user_id_template_id_preference_type: {
                        user_id,
                        template_id,
                        preference_type,
                    },
                },
                update: {
                    rating,
                    notes,
                    updated_at: new Date(),
                },
                create: {
                    user_id,
                    template_id,
                    preference_type,
                    rating,
                    notes,
                },
            });
            console.log("✅ Meal preference saved successfully");
            return preference;
        }
        catch (error) {
            console.error("💥 Error saving meal preference:", error);
            throw error;
        }
    }
    // Helper methods
    static getCookingTimeFromMealCount(meals_per_day) {
        if (meals_per_day <= 2)
            return "minimal"; // 15-30 min total
        if (meals_per_day === 3)
            return "moderate"; // 30-60 min total
        return "extensive"; // 60+ min total
    }
    static estimateIngredientCost(name, quantity, unit) {
        // Simple cost estimation - in a real app, you'd use actual pricing data
        const baseCosts = {
            // Proteins (per 100g)
            chicken: 3.0,
            beef: 5.0,
            fish: 4.0,
            salmon: 6.0,
            eggs: 0.5,
            tofu: 2.0,
            turkey: 4.0,
            pork: 3.5,
            tuna: 3.0,
            shrimp: 8.0,
            // Vegetables (per 100g)
            tomato: 0.8,
            onion: 0.5,
            carrot: 0.6,
            broccoli: 1.2,
            spinach: 1.5,
            avocado: 2.0,
            "sweet potato": 0.7,
            potato: 0.4,
            bell: 1.0, // bell pepper
            pepper: 1.0,
            cucumber: 0.7,
            lettuce: 1.0,
            garlic: 2.0,
            mushroom: 1.5,
            zucchini: 0.8,
            // Grains (per 100g)
            rice: 0.3,
            quinoa: 1.2,
            pasta: 0.4,
            bread: 0.8,
            oats: 0.5,
            flour: 0.2,
            "brown rice": 0.4,
            // Dairy (per 100g/ml)
            milk: 0.1,
            yogurt: 0.8,
            cheese: 2.5,
            feta: 3.0,
            butter: 1.5,
            cream: 1.0,
            "greek yogurt": 1.2,
            // Fruits (per 100g)
            apple: 0.6,
            banana: 0.4,
            orange: 0.7,
            berries: 2.0,
            lemon: 0.8,
            lime: 0.9,
            // Nuts and seeds (per 100g)
            almonds: 4.0,
            walnuts: 5.0,
            seeds: 3.0,
            "peanut butter": 2.0,
            // Oils and condiments (per 100ml/g)
            "olive oil": 3.0,
            oil: 2.0,
            vinegar: 1.0,
            salt: 0.1,
            honey: 2.0,
            "soy sauce": 1.5,
            // Legumes (per 100g)
            beans: 0.8,
            lentils: 1.0,
            chickpeas: 0.9,
            // Default
            default: 1.0,
        };
        // Normalize ingredient name for lookup
        const normalizedName = name.toLowerCase().trim();
        // Try to find exact match first
        let baseCost = baseCosts[normalizedName];
        // If no exact match, try partial matches
        if (!baseCost) {
            for (const [key, cost] of Object.entries(baseCosts)) {
                if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    baseCost = cost;
                    break;
                }
            }
        }
        // Use default if still no match
        if (!baseCost) {
            baseCost = baseCosts.default;
        }
        // Convert units to standardized quantities
        let quantityMultiplier = quantity;
        switch (unit.toLowerCase()) {
            case "kg":
                quantityMultiplier = quantity * 10; // Convert kg to 100g units
                break;
            case "g":
                quantityMultiplier = quantity / 100; // Convert g to 100g units
                break;
            case "lb":
                quantityMultiplier = quantity * 4.54; // Convert lb to 100g units (1 lb ≈ 454g)
                break;
            case "oz":
                quantityMultiplier = quantity * 0.28; // Convert oz to 100g units (1 oz ≈ 28g)
                break;
            case "ml":
            case "l":
                // For liquids, treat similar to weight
                quantityMultiplier = unit === "l" ? quantity * 10 : quantity / 100;
                break;
            case "cup":
                quantityMultiplier = quantity * 2.4; // Approximate cup to 100g units
                break;
            case "tbsp":
                quantityMultiplier = quantity * 0.15; // Approximate tbsp to 100g units
                break;
            case "tsp":
                quantityMultiplier = quantity * 0.05; // Approximate tsp to 100g units
                break;
            case "piece":
            case "pieces":
            case "item":
            case "items":
                // For pieces, use a moderate multiplier
                quantityMultiplier = quantity * 0.5;
                break;
            default:
                // For unknown units, use quantity as-is
                quantityMultiplier = quantity;
        }
        const totalCost = baseCost * quantityMultiplier;
        return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
    }
    // Additional utility methods
    static async getActiveMealPlan(user_id) {
        try {
            const activePlan = await database_1.prisma.userMealPlan.findFirst({
                where: {
                    user_id,
                    is_active: true,
                },
                include: {
                    schedules: {
                        include: {
                            template: true,
                        },
                    },
                },
            });
            return activePlan;
        }
        catch (error) {
            console.error("Error getting active meal plan:", error);
            throw error;
        }
    }
    static async deactivateMealPlan(user_id, plan_id) {
        try {
            await database_1.prisma.userMealPlan.update({
                where: {
                    plan_id,
                    user_id,
                },
                data: {
                    is_active: false,
                },
            });
            console.log("✅ Meal plan deactivated successfully");
            return { success: true };
        }
        catch (error) {
            console.error("Error deactivating meal plan:", error);
            throw error;
        }
    }
    static async duplicateMealPlan(user_id, plan_id, new_name) {
        try {
            const originalPlan = await database_1.prisma.userMealPlan.findFirst({
                where: {
                    plan_id,
                    user_id,
                },
                include: {
                    schedules: {
                        include: {
                            template: true,
                        },
                    },
                },
            });
            if (!originalPlan) {
                throw new Error("Original meal plan not found");
            }
            // Create new meal plan
            const newPlan = await database_1.prisma.userMealPlan.create({
                data: {
                    user_id,
                    name: new_name,
                    plan_type: originalPlan.plan_type,
                    meals_per_day: originalPlan.meals_per_day,
                    snacks_per_day: originalPlan.snacks_per_day,
                    rotation_frequency_days: originalPlan.rotation_frequency_days,
                    include_leftovers: originalPlan.include_leftovers,
                    fixed_meal_times: originalPlan.fixed_meal_times,
                    target_calories_daily: originalPlan.target_calories_daily,
                    target_protein_daily: originalPlan.target_protein_daily,
                    target_carbs_daily: originalPlan.target_carbs_daily,
                    target_fats_daily: originalPlan.target_fats_daily,
                    start_date: new Date(),
                    is_active: false,
                },
            });
            // Duplicate schedules
            for (const schedule of originalPlan.schedules) {
                await database_1.prisma.mealPlanSchedule.create({
                    data: {
                        plan_id: newPlan.plan_id,
                        template_id: schedule.template_id,
                        day_of_week: schedule.day_of_week,
                        meal_timing: schedule.meal_timing,
                        meal_order: schedule.meal_order,
                        portion_multiplier: schedule.portion_multiplier,
                        is_optional: schedule.is_optional,
                    },
                });
            }
            console.log("✅ Meal plan duplicated successfully");
            return newPlan;
        }
        catch (error) {
            console.error("Error duplicating meal plan:", error);
            throw error;
        }
    }
    static async getMealPlanNutritionSummary(user_id, plan_id) {
        try {
            const weeklyPlan = await this.getUserMealPlan(user_id, plan_id);
            const nutritionSummary = {
                daily_averages: {
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fats_g: 0,
                    fiber_g: 0,
                    sugar_g: 0,
                    sodium_mg: 0,
                },
                weekly_totals: {
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fats_g: 0,
                    fiber_g: 0,
                    sugar_g: 0,
                    sodium_mg: 0,
                },
                daily_breakdown: {},
            };
            const days = Object.keys(weeklyPlan);
            days.forEach((day) => {
                const dayNutrition = {
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fats_g: 0,
                    fiber_g: 0,
                    sugar_g: 0,
                    sodium_mg: 0,
                };
                Object.values(weeklyPlan[day]).forEach((meals) => {
                    meals.forEach((meal) => {
                        dayNutrition.calories += meal.calories || 0;
                        dayNutrition.protein_g += meal.protein_g || 0;
                        dayNutrition.carbs_g += meal.carbs_g || 0;
                        dayNutrition.fats_g += meal.fats_g || 0;
                        dayNutrition.fiber_g += meal.fiber_g || 0;
                        dayNutrition.sugar_g += meal.sugar_g || 0;
                        dayNutrition.sodium_mg += meal.sodium_mg || 0;
                    });
                });
                nutritionSummary.daily_breakdown[day] = dayNutrition;
                // Add to weekly totals
                nutritionSummary.weekly_totals.calories += dayNutrition.calories;
                nutritionSummary.weekly_totals.protein_g += dayNutrition.protein_g;
                nutritionSummary.weekly_totals.carbs_g += dayNutrition.carbs_g;
                nutritionSummary.weekly_totals.fats_g += dayNutrition.fats_g;
                nutritionSummary.weekly_totals.fiber_g += dayNutrition.fiber_g;
                nutritionSummary.weekly_totals.sugar_g += dayNutrition.sugar_g;
                nutritionSummary.weekly_totals.sodium_mg += dayNutrition.sodium_mg;
            });
            // Calculate daily averages
            const numDays = days.length;
            nutritionSummary.daily_averages.calories = Math.round(nutritionSummary.weekly_totals.calories / numDays);
            nutritionSummary.daily_averages.protein_g =
                Math.round((nutritionSummary.weekly_totals.protein_g / numDays) * 10) /
                    10;
            nutritionSummary.daily_averages.carbs_g =
                Math.round((nutritionSummary.weekly_totals.carbs_g / numDays) * 10) /
                    10;
            nutritionSummary.daily_averages.fats_g =
                Math.round((nutritionSummary.weekly_totals.fats_g / numDays) * 10) / 10;
            nutritionSummary.daily_averages.fiber_g =
                Math.round((nutritionSummary.weekly_totals.fiber_g / numDays) * 10) /
                    10;
            nutritionSummary.daily_averages.sugar_g =
                Math.round((nutritionSummary.weekly_totals.sugar_g / numDays) * 10) /
                    10;
            nutritionSummary.daily_averages.sodium_mg = Math.round(nutritionSummary.weekly_totals.sodium_mg / numDays);
            return nutritionSummary;
        }
        catch (error) {
            console.error("Error calculating nutrition summary:", error);
            throw error;
        }
    }
}
exports.MealPlanService = MealPlanService;
//# sourceMappingURL=mealPlans.js.map