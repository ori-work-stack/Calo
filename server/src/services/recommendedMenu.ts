import { OpenAIService } from "./openai";
import { prisma } from "../lib/database";

export interface MenuGenerationRequest {
  userId: string;
  days?: number;
  mealsPerDay?: string;
  mealChangeFrequency?: string;
  includeLeftovers?: boolean;
  sameMealTimes?: boolean;
  targetCalories?: number;
  dietaryPreferences?: string[];
  excludedIngredients?: string[];
  budget?: number;
}

export class RecommendedMenuService {
  static async generatePersonalizedMenu(request: MenuGenerationRequest) {
    const {
      userId,
      days = 7,
      mealsPerDay = "3_main",
      mealChangeFrequency = "daily",
      includeLeftovers = false,
      sameMealTimes = true,
    } = request;

    console.log("🍽️ Generating personalized menu for user:", userId);

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
      days,
      mealsPerDay,
      mealChangeFrequency,
      includeLeftovers,
      sameMealTimes
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
    days: number,
    mealsPerDay: string,
    mealChangeFrequency: string,
    includeLeftovers: boolean,
    sameMealTimes: boolean
  ) {
    const prompt = this.buildMenuPrompt(
      questionnaire,
      nutritionalNeeds,
      days,
      mealsPerDay,
      mealChangeFrequency,
      includeLeftovers,
      sameMealTimes
    );

    try {
      const response = await OpenAIService.generateText(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error("Error generating menu with AI:", error);
      // Return fallback menu structure
      return this.getFallbackMenu(nutritionalNeeds, days, mealsPerDay);
    }
  }

  private static buildMenuPrompt(
    questionnaire: any,
    nutritionalNeeds: any,
    days: number,
    mealsPerDay: string,
    mealChangeFrequency: string,
    includeLeftovers: boolean,
    sameMealTimes: boolean
  ) {
    const {
      dietary_style,
      allergies,
      disliked_foods,
      liked_foods,
      cooking_preference,
      available_cooking_methods,
      daily_food_budget,
      kosher,
      medical_conditions_text,
    } = questionnaire;

    const mealStructure = this.getMealStructure(mealsPerDay);

    return `Generate a ${days}-day personalized meal plan in Hebrew and English with the following requirements:

Meal Structure: ${mealStructure}
Change Frequency: ${mealChangeFrequency}
Include Leftovers: ${includeLeftovers ? "Yes" : "No"}
Same Meal Times: ${sameMealTimes ? "Yes" : "No"}

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

Medical considerations: ${medical_conditions_text || "None"}

Return JSON in this exact format:
{
  "title": "תפריט אישי ל-${days} ימים",
  "description": "תפריט מותאם אישית בהתבסס על השאלון שלך",
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
  "meal_structure": "${mealsPerDay}",
  "meals": [
    {
      "name": "שם המנה",
      "name_english": "Meal name in English",
      "meal_type": "BREAKFAST|LUNCH|DINNER|SNACK|INTERMEDIATE",
      "day_number": 1,
      "meal_time": "07:00|12:00|19:00|etc",
      "calories": calories_for_this_meal,
      "protein": protein_in_grams,
      "carbs": carbs_in_grams,
      "fat": fat_in_grams,
      "fiber": fiber_in_grams,
      "sugar": sugar_in_grams,
      "sodium": sodium_in_mg,
      "cholesterol": cholesterol_in_mg,
      "prep_time_minutes": prep_time,
      "cooking_method": "cooking_method",
      "difficulty": "easy|medium|hard",
      "instructions": "הוראות הכנה קצרות ופשוטות",
      "instructions_english": "Brief cooking instructions in English",
      "category": "vegetarian|vegan|gluten_free|etc",
      "allergens": ["milk", "eggs", "nuts"],
      "is_favorite": false,
      "ingredients": [
        {
          "name": "שם המרכיב",
          "name_english": "ingredient_name",
          "quantity": numeric_quantity,
          "unit": "גרם|כפות|יחידות",
          "unit_english": "g|tbsp|pieces",
          "category": "protein|carbs|vegetables|dairy|fats",
          "estimated_cost": estimated_cost_in_dollars,
          "calories_per_unit": calories_per_specified_unit,
          "protein_per_unit": protein_per_specified_unit,
          "icon": "🥚|🥩|🥬|etc"
        }
      ]
    }
  ]
}`;
  }

  private static getMealStructure(mealsPerDay: string): string {
    switch (mealsPerDay) {
      case "3_main":
        return "3 ארוחות עיקריות (בוקר, צהריים, ערב)";
      case "3_plus_2_snacks":
        return "3 ארוחות עיקריות + 2 נשנושים";
      case "2_plus_1_intermediate":
        return "2 ארוחות עיקריות + 1 ארוחת ביניים (מתאים לצום לסירוגין)";
      default:
        return "3 ארוחות עיקריות";
    }
  }

  private static getFallbackMenu(
    nutritionalNeeds: any,
    days: number,
    mealsPerDay: string
  ) {
    return {
      title: `תפריט מאוזן ל-${days} ימים`,
      description: "תפריט מאוזן המותאם לצרכים התזונתיים שלך",
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
      meal_structure: mealsPerDay,
      meals: [], // Would populate with basic balanced meals
    };
  }

  private static async saveMenuToDatabase(userId: string, menuData: any) {
    console.log("💾 Saving menu to database for user:", userId);

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

    console.log("✅ Menu saved successfully:", menu.menu_id);
    return menu;
  }

  static async getUserMenus(userId: string) {
    console.log("📋 Getting user menus for:", userId);

    return await prisma.recommendedMenu.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
          orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getMenuById(userId: string, menuId: string) {
    console.log("🔍 Getting menu by ID:", menuId, "for user:", userId);

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

  static async replaceMeal(
    userId: string,
    menuId: string,
    mealId: string,
    preferences: any
  ) {
    console.log("🔄 Replacing meal:", mealId, "in menu:", menuId);

    // Get the current meal
    const currentMeal = await prisma.recommendedMeal.findFirst({
      where: {
        meal_id: mealId,
        menu: {
          menu_id: menuId,
          user_id: userId,
        },
      },
      include: {
        ingredients: true,
      },
    });

    if (!currentMeal) {
      throw new Error("Meal not found");
    }

    // Generate a replacement meal using AI
    const replacementMeal = await this.generateReplacementMeal(
      currentMeal,
      preferences
    );

    // Update the meal in database
    const updatedMeal = await prisma.recommendedMeal.update({
      where: { meal_id: mealId },
      data: {
        name: replacementMeal.name,
        calories: replacementMeal.calories,
        protein: replacementMeal.protein,
        carbs: replacementMeal.carbs,
        fat: replacementMeal.fat,
        fiber: replacementMeal.fiber,
        prep_time_minutes: replacementMeal.prep_time_minutes,
        cooking_method: replacementMeal.cooking_method,
        instructions: replacementMeal.instructions,
        ingredients: {
          deleteMany: {},
          create: replacementMeal.ingredients.map((ingredient: any) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
            estimated_cost: ingredient.estimated_cost,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    });

    return updatedMeal;
  }

  private static async generateReplacementMeal(
    currentMeal: any,
    preferences: any
  ) {
    // Simplified replacement logic - in real implementation, use AI
    const replacementMeals = [
      {
        name: "חביתה עם ירקות",
        calories: currentMeal.calories,
        protein: currentMeal.protein,
        carbs: currentMeal.carbs,
        fat: currentMeal.fat,
        fiber: currentMeal.fiber,
        prep_time_minutes: 15,
        cooking_method: "מחבת",
        instructions: "טגנו ביצים עם ירקות טריים",
        ingredients: [
          {
            name: "ביצים",
            quantity: 2,
            unit: "יחידות",
            category: "protein",
            estimated_cost: 2.0,
          },
          {
            name: "ירקות מעורבים",
            quantity: 100,
            unit: "גרם",
            category: "vegetables",
            estimated_cost: 1.5,
          },
        ],
      },
    ];

    return replacementMeals[0];
  }

  static async markMealAsFavorite(
    userId: string,
    menuId: string,
    mealId: string,
    isFavorite: boolean
  ) {
    console.log("❤️ Marking meal as favorite:", mealId, isFavorite);

    // In a full implementation, you might want to track favorites in a separate table
    // For now, we'll just log this action
    console.log(
      `Meal ${mealId} marked as ${isFavorite ? "favorite" : "not favorite"}`
    );
  }

  static async giveMealFeedback(
    userId: string,
    menuId: string,
    mealId: string,
    liked: boolean
  ) {
    console.log("💬 Recording meal feedback:", mealId, liked);

    // In a full implementation, you might want to track feedback in a separate table
    // For now, we'll just log this action
    console.log(`Meal ${mealId} feedback: ${liked ? "liked" : "disliked"}`);
  }

  static async generateShoppingList(userId: string, menuId: string) {
    console.log("🛒 Generating shopping list for menu:", menuId);

    const menu = await this.getMenuById(userId, menuId);
    if (!menu) {
      throw new Error("Menu not found");
    }

    // Aggregate ingredients by category
    const shoppingList = new Map();

    menu.meals.forEach((meal: any) => {
      meal.ingredients.forEach((ingredient: any) => {
        const key = `${ingredient.name}_${ingredient.unit}`;
        if (shoppingList.has(key)) {
          const existing = shoppingList.get(key);
          existing.quantity += ingredient.quantity;
          existing.estimated_cost += ingredient.estimated_cost || 0;
        } else {
          shoppingList.set(key, {
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
            estimated_cost: ingredient.estimated_cost || 0,
          });
        }
      });
    });

    // Group by category
    const categorizedList = {};
    Array.from(shoppingList.values()).forEach((item: any) => {
      if (!categorizedList[item.category]) {
        categorizedList[item.category] = [];
      }
      categorizedList[item.category].push(item);
    });

    return {
      menu_id: menuId,
      total_estimated_cost: Array.from(shoppingList.values()).reduce(
        (sum: number, item: any) => sum + item.estimated_cost,
        0
      ),
      categories: categorizedList,
      generated_at: new Date().toISOString(),
    };
  }

  static async startMenuToday(userId: string, menuId: string) {
    console.log("🚀 Starting menu today:", menuId);

    // In a full implementation, you might want to track menu usage
    // For now, we'll just log this action
    console.log(`Menu ${menuId} started for user ${userId}`);
  }
}
