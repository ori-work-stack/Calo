import { prisma } from "../lib/database";
import { OpenAIService } from "./openai";

export interface MealPlanTemplate {
  template_id: string;
  name: string;
  description?: string | null; // Changed from string | undefined to string | null
  meal_timing: string;
  dietary_category: string;
  prep_time_minutes?: number | null; // Also fix this to match Prisma
  difficulty_level?: number | null; // Also fix this to match Prisma
  calories?: number | null; // Also fix this to match Prisma
  protein_g?: number | null; // Also fix this to match Prisma
  carbs_g?: number | null; // Also fix this to match Prisma
  fats_g?: number | null; // Also fix this to match Prisma
  fiber_g?: number | null; // Also fix this to match Prisma
  sugar_g?: number | null; // Also fix this to match Prisma
  sodium_mg?: number | null; // Also fix this to match Prisma
  ingredients: any[];
  instructions: any[];
  allergens: string[];
  image_url?: string | null; // Also fix this to match Prisma
}

export interface UserMealPlanConfig {
  name: string;
  meals_per_day: number;
  snacks_per_day: number;
  rotation_frequency_days: number;
  include_leftovers: boolean;
  fixed_meal_times: boolean;
  dietary_preferences: string[];
  excluded_ingredients: string[];
}

export interface WeeklyMealPlan {
  [day: string]: {
    [mealTiming: string]: MealPlanTemplate[];
  };
}

export class MealPlanService {
  static async createUserMealPlan(user_id: string, config: UserMealPlanConfig) {
    try {
      console.log("🍽️ Creating AI-powered meal plan for user:", user_id);

      // Get user's questionnaire data for personalization
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id },
        orderBy: { date_completed: "desc" },
      });

      // Get user's nutrition goals
      const nutritionPlan = await prisma.nutritionPlan.findFirst({
        where: { user_id },
        orderBy: { created_at: "desc" },
      });

      // Get user's basic info
      const user = await prisma.user.findUnique({
        where: { user_id },
        select: {
          age: true,
          weight_kg: true,
          height_cm: true,
        },
      });

      // Generate AI meal plan
      const aiMealPlan = await this.generateAIMealPlan(
        config,
        questionnaire,
        nutritionPlan,
        user
      );

      // Create the meal plan
      const mealPlan = await prisma.userMealPlan.create({
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
        },
      });

      // Store AI-generated meal templates and create schedule
      await this.storeAIMealTemplatesAndSchedule(mealPlan.plan_id, aiMealPlan);

      console.log("✅ AI meal plan created successfully");
      return mealPlan;
    } catch (error) {
      console.error("💥 Error creating AI meal plan:", error);
      throw new Error("Failed to create meal plan");
    }
  }

  static async generateAIMealPlan(
    config: UserMealPlanConfig,
    questionnaire: any,
    nutritionPlan: any,
    user: any
  ) {
    try {
      console.log("🤖 Generating AI meal plan...");

      // Build user profile for AI
      const userProfile = this.buildUserProfile(
        config,
        questionnaire,
        nutritionPlan,
        user
      );

      // Generate meal plan using OpenAI
      const aiResponse = await OpenAIService.generateMealPlan(userProfile);

      console.log("✅ AI meal plan generated successfully");
      return aiResponse;
    } catch (error) {
      console.error("💥 Error generating AI meal plan:", error);
      throw error;
    }
  }

  static buildUserProfile(
    config: UserMealPlanConfig,
    questionnaire: any,
    nutritionPlan: any,
    user: any
  ) {
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
      dietary_preferences: config.dietary_preferences,
      excluded_ingredients: config.excluded_ingredients,
      allergies: questionnaire?.allergies || [],

      // Lifestyle factors
      physical_activity_level:
        questionnaire?.physical_activity_level || "MODERATE",
      sport_frequency: questionnaire?.sport_frequency || "TWO_TO_THREE",
      main_goal: questionnaire?.main_goal || "GENERAL_HEALTH",

      // Food preferences from questionnaire
      dietary_preferences_questionnaire:
        questionnaire?.dietary_preferences || [],
      avoided_foods: questionnaire?.avoided_foods || [],
      meal_texture_preference: questionnaire?.meal_texture_preference,

      // Cooking preferences
      cooking_skill_level: "intermediate", // Could be derived from questionnaire
      available_cooking_time: this.getCookingTimeFromMealCount(
        config.meals_per_day
      ),
      kitchen_equipment: ["oven", "stovetop", "microwave"], // Could be from questionnaire
    };
  }

  static async storeAIMealTemplatesAndSchedule(
    plan_id: string,
    aiMealPlan: any
  ) {
    try {
      console.log("💾 Storing AI-generated meal templates and schedule...");

      const templateIds: Record<string, string> = {};

      // Store each unique meal template
      for (const dayPlan of aiMealPlan.weekly_plan) {
        for (const meal of dayPlan.meals) {
          if (!templateIds[meal.name]) {
            const template = await prisma.mealTemplate.create({
              data: {
                name: meal.name,
                description: meal.description,
                meal_timing: meal.meal_timing as any,
                dietary_category: meal.dietary_category as any,
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
            templateIds[meal.name] = template.template_id;
          }
        }
      }

      // Create meal schedule
      for (
        let dayIndex = 0;
        dayIndex < aiMealPlan.weekly_plan.length;
        dayIndex++
      ) {
        const dayPlan = aiMealPlan.weekly_plan[dayIndex];

        for (let mealIndex = 0; mealIndex < dayPlan.meals.length; mealIndex++) {
          const meal = dayPlan.meals[mealIndex];

          await prisma.mealPlanSchedule.create({
            data: {
              plan_id,
              template_id: templateIds[meal.name],
              day_of_week: dayIndex,
              meal_timing: meal.meal_timing as any,
              meal_order: mealIndex + 1,
              portion_multiplier: meal.portion_multiplier || 1.0,
              is_optional: meal.is_optional || false,
            },
          });
        }
      }

      console.log("✅ AI meal templates and schedule stored successfully");
    } catch (error) {
      console.error("💥 Error storing AI meal templates:", error);
      throw error;
    }
  }

  static async getUserMealPlan(
    user_id: string,
    plan_id?: string
  ): Promise<WeeklyMealPlan> {
    try {
      console.log("📋 Getting meal plan for user:", user_id);

      // Get the active meal plan or specific plan
      const mealPlan = await prisma.userMealPlan.findFirst({
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
      const weeklyPlan: WeeklyMealPlan = {};
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

        const daySchedules = mealPlan.schedules.filter(
          (s) => s.day_of_week === day
        );

        // Group by meal timing
        const timingGroups = daySchedules.reduce((acc, schedule) => {
          const timing = schedule.meal_timing;
          if (!acc[timing]) acc[timing] = [];
          acc[timing].push({
            template_id: schedule.template.template_id,
            name: schedule.template.name,
            description: schedule.template.description,
            meal_timing: schedule.template.meal_timing,
            dietary_category: schedule.template.dietary_category,
            prep_time_minutes: schedule.template.prep_time_minutes,
            difficulty_level: schedule.template.difficulty_level,
            calories:
              (schedule.template.calories || 0) * schedule.portion_multiplier,
            protein_g:
              (schedule.template.protein_g || 0) * schedule.portion_multiplier,
            carbs_g:
              (schedule.template.carbs_g || 0) * schedule.portion_multiplier,
            fats_g:
              (schedule.template.fats_g || 0) * schedule.portion_multiplier,
            fiber_g:
              (schedule.template.fiber_g || 0) * schedule.portion_multiplier,
            sugar_g:
              (schedule.template.sugar_g || 0) * schedule.portion_multiplier,
            sodium_mg:
              (schedule.template.sodium_mg || 0) * schedule.portion_multiplier,
            ingredients: (schedule.template.ingredients_json as any[]) || [],
            instructions: (schedule.template.instructions_json as any[]) || [],
            allergens: (schedule.template.allergens_json as string[]) || [],
            image_url: schedule.template.image_url,
          });
          return acc;
        }, {} as Record<string, MealPlanTemplate[]>);

        weeklyPlan[dayName] = timingGroups;
      }

      console.log("✅ Meal plan retrieved successfully");
      return weeklyPlan;
    } catch (error) {
      console.error("💥 Error getting meal plan:", error);
      throw error;
    }
  }

  static async replaceMealInPlan(
    user_id: string,
    plan_id: string,
    day_of_week: number,
    meal_timing: string,
    meal_order: number,
    preferences?: { dietary_category?: string; max_prep_time?: number }
  ) {
    try {
      console.log("🔄 AI-powered meal replacement in plan:", {
        plan_id,
        day_of_week,
        meal_timing,
        meal_order,
      });

      // Verify the plan belongs to the user
      const mealPlan = await prisma.userMealPlan.findFirst({
        where: { plan_id, user_id },
        include: {
          schedules: {
            where: {
              day_of_week,
              meal_timing: meal_timing as any,
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
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id },
        orderBy: { date_completed: "desc" },
      });

      const user = await prisma.user.findUnique({
        where: { user_id },
        select: { age: true, weight_kg: true, height_cm: true },
      });

      // Generate AI replacement meal
      const replacementMeal = await OpenAIService.generateReplacementMeal({
        current_meal: {
          name: currentMeal.name,
          meal_timing: currentMeal.meal_timing,
          dietary_category: currentMeal.dietary_category,
          calories: Number(currentMeal.calories),
          protein_g: Number(currentMeal.protein_g),
          carbs_g: Number(currentMeal.carbs_g),
          fats_g: Number(currentMeal.fats_g),
        },
        user_preferences: {
          dietary_preferences: (mealPlan.dietary_preferences as string[]) || [],
          excluded_ingredients:
            (mealPlan.excluded_ingredients as string[]) || [],
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
      const newTemplate = await prisma.mealTemplate.create({
        data: {
          name: replacementMeal.name,
          description: replacementMeal.description,
          meal_timing: replacementMeal.meal_timing as any,
          dietary_category: replacementMeal.dietary_category as any,
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
      await prisma.mealPlanSchedule.updateMany({
        where: {
          plan_id,
          day_of_week,
          meal_timing: meal_timing as any,
          meal_order,
        },
        data: {
          template_id: newTemplate.template_id,
        },
      });

      console.log("✅ AI meal replacement completed successfully");
      return { success: true, new_meal: newTemplate };
    } catch (error) {
      console.error("💥 Error replacing meal with AI:", error);
      throw error;
    }
  }

  static async generateShoppingList(
    user_id: string,
    plan_id: string,
    week_start_date: string
  ) {
    try {
      console.log("🛒 Generating shopping list for plan:", plan_id);

      const mealPlan = await prisma.userMealPlan.findFirst({
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
      const ingredientMap = new Map<
        string,
        { quantity: number; unit: string; category: string }
      >();

      mealPlan.schedules.forEach((schedule) => {
        const ingredients = (schedule.template.ingredients_json as any[]) || [];
        ingredients.forEach((ingredient) => {
          const key = ingredient.name.toLowerCase();
          const existing = ingredientMap.get(key);

          if (existing) {
            existing.quantity +=
              (ingredient.quantity || 1) * schedule.portion_multiplier;
          } else {
            ingredientMap.set(key, {
              quantity:
                (ingredient.quantity || 1) * schedule.portion_multiplier,
              unit: ingredient.unit || "piece",
              category: ingredient.category || "Other",
            });
          }
        });
      });

      // Convert to shopping list format
      const shoppingItems = Array.from(ingredientMap.entries()).map(
        ([name, details]) => ({
          name,
          quantity: Math.ceil(details.quantity),
          unit: details.unit,
          category: details.category,
          estimated_cost: this.estimateIngredientCost(
            name,
            details.quantity,
            details.unit
          ),
          is_purchased: false,
        })
      );

      // Group by category
      const groupedItems = shoppingItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate total estimated cost
      const totalCost = shoppingItems.reduce(
        (sum, item) => sum + item.estimated_cost,
        0
      );

      // Create shopping list
      const shoppingList = await prisma.shoppingList.create({
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
    } catch (error) {
      console.error("💥 Error generating shopping list:", error);
      throw error;
    }
  }

  static async saveMealPreference(
    user_id: string,
    template_id: string,
    preference_type: string,
    rating?: number,
    notes?: string
  ) {
    try {
      console.log("💝 Saving meal preference:", {
        template_id,
        preference_type,
        rating,
      });

      const preference = await prisma.userMealPreference.upsert({
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
    } catch (error) {
      console.error("💥 Error saving meal preference:", error);
      throw error;
    }
  }

  // Helper methods

  private static getCookingTimeFromMealCount(meals_per_day: number): string {
    if (meals_per_day <= 2) return "minimal"; // 15-30 min total
    if (meals_per_day === 3) return "moderate"; // 30-60 min total
    return "extensive"; // 60+ min total
  }

  private static estimateIngredientCost(
    name: string,
    quantity: number,
    unit: string
  ): number {
    // Simple cost estimation - in a real app, you'd use actual pricing data
    const baseCosts: Record<string, number> = {
      // Proteins (per 100g)
      chicken: 3.0,
      beef: 5.0,
      fish: 4.0,
      salmon: 6.0,
      eggs: 0.5,
      tofu: 2.0,

      // Vegetables (per 100g)
      tomato: 0.8,
      onion: 0.5,
      carrot: 0.6,
      broccoli: 1.2,
      spinach: 1.5,
      avocado: 2.0,
      "sweet potato": 0.7,

      // Grains (per 100g)
      rice: 0.3,
      quinoa: 1.2,
      pasta: 0.4,
      bread: 0.8,
      oats: 0.5,

      // Dairy (per 100g/ml)
      milk: 0.1,
      yogurt: 0.8,
      cheese: 2.5,
      feta: 3.0,

      // Default
      default: 1.0,
    };

    const baseCost = baseCosts[name.toLowerCase()] || baseCosts.default;
    const quantityMultiplier = unit === "kg" ? quantity * 10 : quantity;

    return Math.round(baseCost * quantityMultiplier * 100) / 100;
  }
}
