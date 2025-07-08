import { OpenAIService } from "./openai";
import { prisma } from "../lib/database";

export interface MenuGenerationRequest {
  userId: string;
  days?: number;
  targetCalories?: number;
  dietaryPreferences?: string[];
  excludedIngredients?: string[];
  budget?: number;
}

export class RecommendedMenuService {
  static async generatePersonalizedMenu(request: MenuGenerationRequest) {
    const { userId, days = 7 } = request;

    // Get user's questionnaire data
    const questionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: userId },
      orderBy: { date_completed: "desc" },
    });

    if (!questionnaire) {
      throw new Error("User questionnaire not found");
    }

    // Calculate nutritional needs based on questionnaire
    const nutritionalNeeds = this.calculateNutritionalNeeds(questionnaire);

    // Generate menu using OpenAI
    const menuData = await this.generateMenuWithAI(
      questionnaire,
      nutritionalNeeds,
      days
    );

    // Save to database
    const savedMenu = await this.saveMenuToDatabase(userId, menuData);

    return savedMenu;
  }

  private static calculateNutritionalNeeds(questionnaire: any) {
    const {
      age,
      gender,
      height_cm,
      weight_kg,
      physical_activity_level,
      main_goal,
    } = questionnaire;

    // Basic BMR calculation (Mifflin-St Jeor equation)
    let bmr = 0;
    if (gender === "זכר") {
      bmr = 10 * (weight_kg || 70) + 6.25 * (height_cm || 170) - 5 * age + 5;
    } else {
      bmr = 10 * (weight_kg || 60) + 6.25 * (height_cm || 160) - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      NONE: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      HIGH: 1.725,
    };

    const totalCalories =
      bmr * (activityMultipliers[physical_activity_level] || 1.2);

    // Adjust based on goal
    let adjustedCalories = totalCalories;
    if (main_goal === "WEIGHT_LOSS") {
      adjustedCalories = totalCalories * 0.8; // 20% deficit
    } else if (main_goal === "WEIGHT_GAIN") {
      adjustedCalories = totalCalories * 1.2; // 20% surplus
    }

    // Macronutrient breakdown
    const protein = (adjustedCalories * 0.25) / 4; // 25% of calories from protein
    const carbs = (adjustedCalories * 0.45) / 4; // 45% of calories from carbs
    const fat = (adjustedCalories * 0.3) / 9; // 30% of calories from fat
    const fiber = Math.max(25, (adjustedCalories / 1000) * 14); // 14g per 1000 calories

    return {
      calories: Math.round(adjustedCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber),
    };
  }

  private static async generateMenuWithAI(
    questionnaire: any,
    nutritionalNeeds: any,
    days: number
  ) {
    const prompt = this.buildMenuPrompt(questionnaire, nutritionalNeeds, days);

    try {
      const response = await OpenAIService.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error("Error generating menu with AI:", error);
      // Return fallback menu structure
      return this.getFallbackMenu(nutritionalNeeds, days);
    }
  }

  private static buildMenuPrompt(
    questionnaire: any,
    nutritionalNeeds: any,
    days: number
  ) {
    const {
      dietary_style,
      allergies,
      disliked_foods,
      liked_foods,
      cooking_preference,
      available_cooking_methods,
      daily_food_budget,
      meals_per_day,
      kosher,
      medical_conditions_text,
    } = questionnaire;

    return `Generate a ${days}-day personalized meal plan in JSON format with the following requirements:

Nutritional Targets (per day):
- Calories: ${nutritionalNeeds.calories}
- Protein: ${nutritionalNeeds.protein}g
- Carbohydrates: ${nutritionalNeeds.carbs}g
- Fat: ${nutritionalNeeds.fat}g
- Fiber: ${nutritionalNeeds.fiber}g

Dietary Preferences:
- Style: ${dietary_style || "Regular"}
- Allergies: ${allergies?.join(", ") || "None"}
- Disliked foods: ${disliked_foods || "None"}
- Liked foods: ${liked_foods || "None"}
- Kosher: ${kosher ? "Yes" : "No"}
- Cooking methods: ${available_cooking_methods?.join(", ") || "All methods"}
- Daily budget: ${daily_food_budget ? `$${daily_food_budget}` : "No limit"}
- Meals per day: ${meals_per_day || 3}

Medical considerations: ${medical_conditions_text || "None"}

Return JSON in this exact format:
{
  "title": "7-Day Personalized Meal Plan",
  "description": "Brief description",
  "total_calories": ${nutritionalNeeds.calories * days},
  "total_protein": ${nutritionalNeeds.protein * days},
  "total_carbs": ${nutritionalNeeds.carbs * days},
  "total_fat": ${nutritionalNeeds.fat * days},
  "total_fiber": ${nutritionalNeeds.fiber * days},
  "days_count": ${days},
  "dietary_category": "${dietary_style || "BALANCED"}",
  "estimated_cost": estimated_total_cost,
  "prep_time_minutes": average_prep_time_per_day,
  "difficulty_level": 1-3,
  "meals": [
    {
      "name": "Meal name",
      "meal_type": "BREAKFAST|LUNCH|DINNER|SNACK",
      "day_number": 1,
      "calories": calories_for_this_meal,
      "protein": protein_in_grams,
      "carbs": carbs_in_grams,
      "fat": fat_in_grams,
      "fiber": fiber_in_grams,
      "prep_time_minutes": prep_time,
      "cooking_method": "cooking_method",
      "instructions": "brief_cooking_instructions",
      "ingredients": [
        {
          "name": "ingredient_name",
          "quantity": numeric_quantity,
          "unit": "unit",
          "category": "protein|carbs|vegetables|etc",
          "estimated_cost": estimated_cost_in_dollars
        }
      ]
    }
  ]
}`;
  }

  private static getFallbackMenu(nutritionalNeeds: any, days: number) {
    return {
      title: `${days}-Day Balanced Meal Plan`,
      description: "A balanced meal plan tailored to your nutritional needs",
      total_calories: nutritionalNeeds.calories * days,
      total_protein: nutritionalNeeds.protein * days,
      total_carbs: nutritionalNeeds.carbs * days,
      total_fat: nutritionalNeeds.fat * days,
      total_fiber: nutritionalNeeds.fiber * days,
      days_count: days,
      dietary_category: "BALANCED",
      estimated_cost: 50 * days,
      prep_time_minutes: 30,
      difficulty_level: 2,
      meals: [], // Would populate with basic balanced meals
    };
  }

  private static async saveMenuToDatabase(userId: string, menuData: any) {
    const menu = await prisma.recommendedMenu.create({
      data: {
        user_id: userId,
        title: menuData.title,
        description: menuData.description,
        total_calories: menuData.total_calories,
        total_protein: menuData.total_protein,
        total_carbs: menuData.total_carbs,
        total_fat: menuData.total_fat,
        total_fiber: menuData.total_fiber,
        days_count: menuData.days_count,
        dietary_category: menuData.dietary_category,
        estimated_cost: menuData.estimated_cost,
        prep_time_minutes: menuData.prep_time_minutes,
        difficulty_level: menuData.difficulty_level,
        meals: {
          create: menuData.meals.map((meal: any) => ({
            name: meal.name,
            meal_type: meal.meal_type,
            day_number: meal.day_number,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            fiber: meal.fiber,
            prep_time_minutes: meal.prep_time_minutes,
            cooking_method: meal.cooking_method,
            instructions: meal.instructions,
            ingredients: {
              create: meal.ingredients.map((ingredient: any) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
                estimated_cost: ingredient.estimated_cost,
              })),
            },
          })),
        },
      },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    return menu;
  }

  static async getUserMenus(userId: string) {
    return await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getMenuById(userId: string, menuId: string) {
    return await prisma.recommendedMenu.findFirst({
      where: {
        menu_id: menuId,
        user_id: userId,
      },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
          orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
        },
      },
    });
  }
}
