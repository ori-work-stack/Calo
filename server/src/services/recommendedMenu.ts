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

    try {
      // Get user's questionnaire data
      const questionnaire = await prisma.userQuestionnaire.findFirst({
        where: { user_id: userId },
        orderBy: { date_completed: "desc" },
      });

      if (!questionnaire) {
        throw new Error(
          "User questionnaire not found. Please complete the questionnaire first."
        );
      }

      console.log("📋 Found questionnaire data for user:", userId);

      // Calculate nutritional needs based on questionnaire
      const nutritionalNeeds = this.calculateNutritionalNeeds(questionnaire);
      console.log("🔢 Calculated nutritional needs:", nutritionalNeeds);

      // Generate comprehensive menu using AI
      const menuData = await this.generateComprehensiveMenuWithAI(
        questionnaire,
        nutritionalNeeds,
        days,
        mealsPerDay,
        mealChangeFrequency,
        includeLeftovers,
        sameMealTimes
      );

      console.log("🤖 AI generated menu data:", {
        title: menuData.title,
        mealsCount: menuData.meals?.length || 0,
        totalCalories: menuData.total_calories,
      });

      // Save complete menu to database
      const savedMenu = await this.saveCompleteMenuToDatabase(userId, menuData);
      console.log("💾 Menu saved successfully with ID:", savedMenu.menu_id);

      return savedMenu;
    } catch (error) {
      console.error("💥 Error generating personalized menu:", error);
      throw error;
    }
  }

  private static calculateNutritionalNeeds(questionnaire: any) {
    const {
      age,
      gender,
      height_cm,
      weight_kg,
      physical_activity_level,
      main_goal,
      target_weight_kg,
    } = questionnaire;

    console.log("🧮 Calculating nutritional needs for:", {
      age,
      gender,
      weight_kg,
      height_cm,
      activity: physical_activity_level,
      goal: main_goal,
    });

    // Enhanced BMR calculation (Mifflin-St Jeor equation)
    let bmr = 0;
    const weight = weight_kg || (gender === "זכר" ? 75 : 65);
    const height = height_cm || (gender === "זכר" ? 175 : 165);
    const userAge = age || 30;

    if (gender === "זכר" || gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * userAge + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * userAge - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      NONE: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      HIGH: 1.725,
    };

    const totalCalories =
      bmr * (activityMultipliers[physical_activity_level] || 1.375);

    // Adjust based on goal
    let adjustedCalories = totalCalories;
    if (main_goal === "WEIGHT_LOSS") {
      adjustedCalories = totalCalories * 0.85; // 15% deficit
    } else if (main_goal === "WEIGHT_GAIN") {
      adjustedCalories = totalCalories * 1.15; // 15% surplus
    }

    // Enhanced macronutrient breakdown based on goal
    let proteinRatio = 0.25;
    let carbRatio = 0.45;
    let fatRatio = 0.3;

    if (main_goal === "WEIGHT_LOSS") {
      proteinRatio = 0.3; // Higher protein for satiety
      carbRatio = 0.35;
      fatRatio = 0.35;
    } else if (main_goal === "SPORTS_PERFORMANCE") {
      proteinRatio = 0.25;
      carbRatio = 0.5; // Higher carbs for performance
      fatRatio = 0.25;
    }

    const protein = (adjustedCalories * proteinRatio) / 4;
    const carbs = (adjustedCalories * carbRatio) / 4;
    const fat = (adjustedCalories * fatRatio) / 9;
    const fiber = Math.max(25, (adjustedCalories / 1000) * 14);

    return {
      calories: Math.round(adjustedCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber),
      bmr: Math.round(bmr),
      targetWeight: target_weight_kg,
    };
  }

  private static async generateComprehensiveMenuWithAI(
    questionnaire: any,
    nutritionalNeeds: any,
    days: number,
    mealsPerDay: string,
    mealChangeFrequency: string,
    includeLeftovers: boolean,
    sameMealTimes: boolean
  ) {
    const prompt = this.buildComprehensiveMenuPrompt(
      questionnaire,
      nutritionalNeeds,
      days,
      mealsPerDay,
      mealChangeFrequency,
      includeLeftovers,
      sameMealTimes
    );

    console.log("🤖 Generating menu with AI...");

    try {
      const response = await OpenAIService.generateText(prompt);
      console.log("🤖 Raw AI response length:", response.length);

      // Parse and validate the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error("🚨 Failed to parse AI response, using fallback");
        return this.getComprehensiveFallbackMenu(
          nutritionalNeeds,
          days,
          mealsPerDay,
          questionnaire
        );
      }

      // Validate the parsed response has required structure
      if (
        !parsedResponse.meals ||
        !Array.isArray(parsedResponse.meals) ||
        parsedResponse.meals.length === 0
      ) {
        console.error("🚨 AI response missing meals array, using fallback");
        return this.getComprehensiveFallbackMenu(
          nutritionalNeeds,
          days,
          mealsPerDay,
          questionnaire
        );
      }

      console.log("✅ AI generated", parsedResponse.meals.length, "meals");
      return parsedResponse;
    } catch (error) {
      console.error("💥 Error generating menu with AI:", error);
      console.log("🔄 Using comprehensive fallback menu");
      return this.getComprehensiveFallbackMenu(
        nutritionalNeeds,
        days,
        mealsPerDay,
        questionnaire
      );
    }
  }

  private static buildComprehensiveMenuPrompt(
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
      age,
      gender,
      main_goal,
    } = questionnaire;

    const mealStructure = this.getMealStructure(mealsPerDay);
    const budget = daily_food_budget || 50;
    const totalBudget = budget * days;

    return `Create a comprehensive ${days}-day personalized meal plan in Hebrew with English translations. This is critical - you MUST return a complete JSON with ALL required meals.

USER PROFILE:
- Age: ${age}, Gender: ${gender}
- Goal: ${main_goal}
- Daily Budget: $${budget} (Total: $${totalBudget})
- Dietary Style: ${dietary_style || "Balanced"}
- Allergies: ${allergies?.join(", ") || "None"}
- Dislikes: ${disliked_foods?.join(", ") || "None"}
- Likes: ${liked_foods?.join(", ") || "None"}
- Kosher: ${kosher ? "Yes" : "No"}
- Cooking Methods: ${available_cooking_methods?.join(", ") || "All methods"}
- Medical Notes: ${medical_conditions_text || "None"}

NUTRITIONAL TARGETS (per day):
- Calories: ${nutritionalNeeds.calories}
- Protein: ${nutritionalNeeds.protein}g
- Carbohydrates: ${nutritionalNeeds.carbs}g
- Fat: ${nutritionalNeeds.fat}g
- Fiber: ${nutritionalNeeds.fiber}g

MEAL STRUCTURE: ${mealStructure}
DAYS: ${days}
CHANGE FREQUENCY: ${mealChangeFrequency}
LEFTOVERS: ${includeLeftovers ? "Include" : "No leftovers"}
SAME TIMES: ${sameMealTimes ? "Fixed meal times" : "Flexible times"}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${this.calculateTotalMeals(days, mealsPerDay)} meals
2. Each meal MUST have complete nutrition data
3. Each meal MUST have detailed ingredients with quantities
4. Stay within budget: $${totalBudget} total
5. Meet daily calorie target: ${nutritionalNeeds.calories} calories

Return this EXACT JSON structure (no markdown, just JSON):
{
  "title": "תפריט אישי ל-${days} ימים - ${main_goal}",
  "description": "תפריט מותאם אישית לפי השאלון והתקציב שלך",
  "total_calories": ${nutritionalNeeds.calories * days},
  "total_protein": ${nutritionalNeeds.protein * days},
  "total_carbs": ${nutritionalNeeds.carbs * days},
  "total_fat": ${nutritionalNeeds.fat * days},
  "total_fiber": ${nutritionalNeeds.fiber * days},
  "days_count": ${days},
  "dietary_category": "${dietary_style || "BALANCED"}",
  "estimated_cost": ${totalBudget},
  "prep_time_minutes": 30,
  "difficulty_level": 2,
  "meal_structure": "${mealsPerDay}",
  "meals": [
    ${this.generateMealExamples(days, mealsPerDay, nutritionalNeeds, budget)}
  ]
}

Generate realistic, budget-friendly meals that people actually want to eat. Include local ingredients available in Israel. Make sure total cost is around $${totalBudget}.`;
  }

  private static calculateTotalMeals(
    days: number,
    mealsPerDay: string
  ): number {
    const mealsPerDayCount = {
      "3_main": 3,
      "3_plus_2_snacks": 5,
      "2_plus_1_intermediate": 3,
    };
    return (
      days *
      (mealsPerDayCount[mealsPerDay as keyof typeof mealsPerDayCount] || 3)
    );
  }

  private static generateMealExamples(
    days: number,
    mealsPerDay: string,
    nutritionalNeeds: any,
    dailyBudget: number
  ): string {
    const mealTypes = this.getMealTypesForStructure(mealsPerDay);
    const examples = [];

    for (let day = 1; day <= Math.min(days, 2); day++) {
      for (let i = 0; i < mealTypes.length; i++) {
        const mealType = mealTypes[i];
        const caloriesPerMeal = Math.round(
          nutritionalNeeds.calories / mealTypes.length
        );
        const proteinPerMeal = Math.round(
          nutritionalNeeds.protein / mealTypes.length
        );
        const carbsPerMeal = Math.round(
          nutritionalNeeds.carbs / mealTypes.length
        );
        const fatPerMeal = Math.round(nutritionalNeeds.fat / mealTypes.length);

        examples.push(`{
      "name": "ארוחה לדוגמה יום ${day}",
      "name_english": "Sample Meal Day ${day}",
      "meal_type": "${mealType}",
      "day_number": ${day},
      "calories": ${caloriesPerMeal},
      "protein": ${proteinPerMeal},
      "carbs": ${carbsPerMeal},
      "fat": ${fatPerMeal},
      "fiber": 8,
      "prep_time_minutes": 20,
      "cooking_method": "בישול פשוט",
      "instructions": "הוראות הכנה מפורטות",
      "instructions_english": "Detailed cooking instructions",
      "ingredients": [
        {
          "name": "רכיב ראשון",
          "name_english": "First ingredient",
          "quantity": 100,
          "unit": "גרם",
          "unit_english": "g",
          "category": "protein",
          "estimated_cost": ${(dailyBudget / mealTypes.length / 3).toFixed(2)}
        }
      ]
    }`);
      }
    }

    return (
      examples.join(",\n    ") +
      "\n    // ... continue pattern for all " +
      this.calculateTotalMeals(days, mealsPerDay) +
      " meals"
    );
  }

  private static getMealTypesForStructure(mealsPerDay: string): string[] {
    switch (mealsPerDay) {
      case "3_main":
        return ["BREAKFAST", "LUNCH", "DINNER"];
      case "3_plus_2_snacks":
        return [
          "BREAKFAST",
          "MORNING_SNACK",
          "LUNCH",
          "AFTERNOON_SNACK",
          "DINNER",
        ];
      case "2_plus_1_intermediate":
        return ["BREAKFAST", "INTERMEDIATE", "DINNER"];
      default:
        return ["BREAKFAST", "LUNCH", "DINNER"];
    }
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

  private static getComprehensiveFallbackMenu(
    nutritionalNeeds: any,
    days: number,
    mealsPerDay: string,
    questionnaire: any
  ) {
    console.log("🔄 Generating comprehensive fallback menu");

    const budget = questionnaire.daily_food_budget || 50;
    const mealTypes = this.getMealTypesForStructure(mealsPerDay);
    const meals = [];

    for (let day = 1; day <= days; day++) {
      for (let mealIndex = 0; mealIndex < mealTypes.length; mealIndex++) {
        const mealType = mealTypes[mealIndex];
        const caloriesPerMeal = Math.round(
          nutritionalNeeds.calories / mealTypes.length
        );
        const proteinPerMeal = Math.round(
          nutritionalNeeds.protein / mealTypes.length
        );
        const carbsPerMeal = Math.round(
          nutritionalNeeds.carbs / mealTypes.length
        );
        const fatPerMeal = Math.round(nutritionalNeeds.fat / mealTypes.length);

        const meal = this.generateFallbackMeal(
          mealType,
          day,
          caloriesPerMeal,
          proteinPerMeal,
          carbsPerMeal,
          fatPerMeal,
          budget / mealTypes.length
        );

        meals.push(meal);
      }
    }

    return {
      title: `תפריט מאוזן ל-${days} ימים - ${
        questionnaire.main_goal || "בריאות כללית"
      }`,
      description: "תפריט מאוזן המותאם לצרכים התזונתיים שלך ולתקציב",
      total_calories: nutritionalNeeds.calories * days,
      total_protein: nutritionalNeeds.protein * days,
      total_carbs: nutritionalNeeds.carbs * days,
      total_fat: nutritionalNeeds.fat * days,
      total_fiber: nutritionalNeeds.fiber * days,
      days_count: days,
      dietary_category: questionnaire.dietary_style || "BALANCED",
      estimated_cost: budget * days,
      prep_time_minutes: 25,
      difficulty_level: 2,
      meal_structure: mealsPerDay,
      meals: meals,
    };
  }

  private static generateFallbackMeal(
    mealType: string,
    day: number,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    budgetPerMeal: number
  ) {
    const mealTemplates = {
      BREAKFAST: {
        name: "חביתה עם לחם מלא",
        name_english: "Whole grain omelet",
        instructions: "מכינים חביתת ביצים עם ירקות ומגישים עם לחם מלא",
        instructions_english:
          "Prepare vegetable omelet and serve with whole grain bread",
        ingredients: [
          {
            name: "ביצים",
            name_english: "eggs",
            quantity: 2,
            unit: "יחידות",
            unit_english: "pieces",
            category: "protein",
            estimated_cost: 3.0,
          },
          {
            name: "לחם מלא",
            name_english: "whole grain bread",
            quantity: 2,
            unit: "פרוסות",
            unit_english: "slices",
            category: "carbs",
            estimated_cost: 2.0,
          },
          {
            name: "ירקות מעורבים",
            name_english: "mixed vegetables",
            quantity: 80,
            unit: "גרם",
            unit_english: "g",
            category: "vegetables",
            estimated_cost: 2.5,
          },
        ],
      },
      LUNCH: {
        name: "חזה עוף עם אורז וירקות",
        name_english: "Chicken breast with rice and vegetables",
        instructions: "צולים חזה עוף, מבשלים אורז ומקדחים ירקות",
        instructions_english:
          "Grill chicken breast, cook rice and steam vegetables",
        ingredients: [
          {
            name: "חזה עוף",
            name_english: "chicken breast",
            quantity: 120,
            unit: "גרם",
            unit_english: "g",
            category: "protein",
            estimated_cost: 8.0,
          },
          {
            name: "אורז",
            name_english: "rice",
            quantity: 80,
            unit: "גרם",
            unit_english: "g",
            category: "carbs",
            estimated_cost: 1.5,
          },
          {
            name: "ירקות מקורמים",
            name_english: "steamed vegetables",
            quantity: 150,
            unit: "גרם",
            unit_english: "g",
            category: "vegetables",
            estimated_cost: 4.0,
          },
        ],
      },
      DINNER: {
        name: "סלמון עם תפוחי אדמה וסלט",
        name_english: "Salmon with potatoes and salad",
        instructions: "אופים סלמון, מבשלים תפוחי אדמה ומכינים סלט טרי",
        instructions_english:
          "Bake salmon, cook potatoes and prepare fresh salad",
        ingredients: [
          {
            name: "פילה סלמון",
            name_english: "salmon fillet",
            quantity: 120,
            unit: "גרם",
            unit_english: "g",
            category: "protein",
            estimated_cost: 12.0,
          },
          {
            name: "תפוחי אדמה",
            name_english: "potatoes",
            quantity: 150,
            unit: "גרם",
            unit_english: "g",
            category: "carbs",
            estimated_cost: 2.0,
          },
          {
            name: "סלט ירוק",
            name_english: "green salad",
            quantity: 100,
            unit: "גרם",
            unit_english: "g",
            category: "vegetables",
            estimated_cost: 3.0,
          },
        ],
      },
      SNACK: {
        name: "יוגורט עם פירות יבשים",
        name_english: "Yogurt with dried fruits",
        instructions: "מערבבים יוגורט עם פירות יבשים ואגוזים",
        instructions_english: "Mix yogurt with dried fruits and nuts",
        ingredients: [
          {
            name: "יוגורט טבעי",
            name_english: "natural yogurt",
            quantity: 150,
            unit: "גרם",
            unit_english: "g",
            category: "dairy",
            estimated_cost: 3.0,
          },
          {
            name: "פירות יבשים",
            name_english: "dried fruits",
            quantity: 30,
            unit: "גרם",
            unit_english: "g",
            category: "fruits",
            estimated_cost: 4.0,
          },
        ],
      },
      MORNING_SNACK: {
        name: "תפוח עם חמאת בוטנים",
        name_english: "Apple with peanut butter",
        instructions: "חותכים תפוח ומגישים עם חמאת בוטנים",
        instructions_english: "Slice apple and serve with peanut butter",
        ingredients: [
          {
            name: "תפוח",
            name_english: "apple",
            quantity: 1,
            unit: "יחידה",
            unit_english: "piece",
            category: "fruits",
            estimated_cost: 1.5,
          },
          {
            name: "חמאת בוטנים",
            name_english: "peanut butter",
            quantity: 20,
            unit: "גרם",
            unit_english: "g",
            category: "fats",
            estimated_cost: 2.0,
          },
        ],
      },
      AFTERNOON_SNACK: {
        name: "גזר וחומוס",
        name_english: "Carrots and hummus",
        instructions: "חותכים גזר לחטיפים ומגישים עם חומוס",
        instructions_english: "Cut carrots into sticks and serve with hummus",
        ingredients: [
          {
            name: "גזר",
            name_english: "carrots",
            quantity: 100,
            unit: "גרם",
            unit_english: "g",
            category: "vegetables",
            estimated_cost: 1.0,
          },
          {
            name: "חומוס",
            name_english: "hummus",
            quantity: 40,
            unit: "גרם",
            unit_english: "g",
            category: "protein",
            estimated_cost: 2.5,
          },
        ],
      },
      INTERMEDIATE: {
        name: "סלט עם קינואה וחלבון",
        name_english: "Quinoa protein salad",
        instructions: "מבשלים קינואה, מוסיפים ירקות וחלבון לבחירה",
        instructions_english:
          "Cook quinoa, add vegetables and protein of choice",
        ingredients: [
          {
            name: "קינואה",
            name_english: "quinoa",
            quantity: 60,
            unit: "גרם",
            unit_english: "g",
            category: "grains",
            estimated_cost: 4.0,
          },
          {
            name: "ירקות מעורבים",
            name_english: "mixed vegetables",
            quantity: 120,
            unit: "גרם",
            unit_english: "g",
            category: "vegetables",
            estimated_cost: 3.5,
          },
          {
            name: "גבינת קוטג'",
            name_english: "cottage cheese",
            quantity: 80,
            unit: "גרם",
            unit_english: "g",
            category: "protein",
            estimated_cost: 4.0,
          },
        ],
      },
    };

    const template =
      mealTemplates[mealType as keyof typeof mealTemplates] ||
      mealTemplates.LUNCH;

    return {
      name: template.name,
      name_english: template.name_english,
      meal_type: mealType,
      day_number: day,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      fiber: Math.round(calories * 0.014), // 14g per 1000 calories
      prep_time_minutes: 20,
      cooking_method: "בישול פשוט",
      instructions: template.instructions,
      instructions_english: template.instructions_english,
      ingredients: template.ingredients,
    };
  }

  private static async saveCompleteMenuToDatabase(
    userId: string,
    menuData: any
  ) {
    console.log("💾 Saving complete menu to database for user:", userId);
    console.log("📊 Menu data structure:", {
      title: menuData.title,
      mealsCount: menuData.meals?.length || 0,
      totalCalories: menuData.total_calories,
    });

    try {
      // First, create the main menu record
      const menu = await prisma.recommendedMenu.create({
        data: {
          user_id: userId,
          title: menuData.title || "תפריט מותאם אישית",
          description: menuData.description || "תפריט מותאם לצרכים שלך",
          total_calories: menuData.total_calories || 0,
          total_protein: menuData.total_protein || 0,
          total_carbs: menuData.total_carbs || 0,
          total_fat: menuData.total_fat || 0,
          total_fiber: menuData.total_fiber || 0,
          days_count: menuData.days_count || 7,
          dietary_category: menuData.dietary_category || "BALANCED",
          estimated_cost: menuData.estimated_cost || 0,
          prep_time_minutes: menuData.prep_time_minutes || 30,
          difficulty_level: menuData.difficulty_level || 2,
        },
      });

      console.log("✅ Main menu created with ID:", menu.menu_id);

      // Then create all meals and their ingredients
      if (
        menuData.meals &&
        Array.isArray(menuData.meals) &&
        menuData.meals.length > 0
      ) {
        console.log("🍽️ Creating", menuData.meals.length, "meals...");

        for (const mealData of menuData.meals) {
          try {
            // Create the meal record
            const meal = await prisma.recommendedMeal.create({
              data: {
                menu_id: menu.menu_id,
                name: mealData.name || "ארוחה",
                meal_type: this.validateMealType(mealData.meal_type),
                day_number: mealData.day_number || 1,
                calories: mealData.calories || 0,
                protein: mealData.protein || 0,
                carbs: mealData.carbs || 0,
                fat: mealData.fat || 0,
                fiber: mealData.fiber || 0,
                prep_time_minutes: mealData.prep_time_minutes || 20,
                cooking_method: mealData.cooking_method || "בישול פשוט",
                instructions: mealData.instructions || "הוראות הכנה",
              },
            });

            // Create ingredients for this meal
            if (mealData.ingredients && Array.isArray(mealData.ingredients)) {
              for (const ingredientData of mealData.ingredients) {
                await prisma.recommendedIngredient.create({
                  data: {
                    meal_id: meal.meal_id,
                    name: ingredientData.name || "רכיב",
                    quantity: ingredientData.quantity || 0,
                    unit: ingredientData.unit || "גרם",
                    category: ingredientData.category || "general",
                    estimated_cost: ingredientData.estimated_cost || 0,
                  },
                });
              }
            }

            console.log(
              `✅ Meal "${mealData.name}" created with ${
                mealData.ingredients?.length || 0
              } ingredients`
            );
          } catch (mealError) {
            console.error("💥 Error creating meal:", mealData.name, mealError);
            // Continue with other meals even if one fails
          }
        }
      } else {
        console.warn(
          "⚠️ No meals provided in menu data, creating sample meals..."
        );
        await this.createSampleMeals(menu.menu_id);
      }

      // Fetch the complete menu with all relations - CRITICAL: This ensures we return the saved data
      const completeMenu = await prisma.recommendedMenu.findUnique({
        where: { menu_id: menu.menu_id },
        include: {
          meals: {
            include: {
              ingredients: true,
            },
            orderBy: [{ day_number: "asc" }, { meal_type: "asc" }],
          },
        },
      });

      if (!completeMenu) {
        throw new Error("Failed to fetch the created menu from database");
      }

      console.log(
        "✅ Complete menu fetched with",
        completeMenu?.meals?.length || 0,
        "meals"
      );
      console.log("📋 Menu structure:", {
        menu_id: completeMenu.menu_id,
        title: completeMenu.title,
        meals_count: completeMenu.meals.length,
        first_meal: completeMenu.meals[0]
          ? {
              name: completeMenu.meals[0].name,
              ingredients_count: completeMenu.meals[0].ingredients.length,
            }
          : null,
      });

      return completeMenu;
    } catch (error) {
      console.error("💥 Error saving menu to database:", error);
      throw new Error("Failed to save menu to database: " + error.message);
    }
  }

  private static validateMealType(mealType: string): string {
    const validTypes = [
      "BREAKFAST",
      "LUNCH",
      "DINNER",
      "SNACK",
      "MORNING_SNACK",
      "AFTERNOON_SNACK",
    ];
    return validTypes.includes(mealType) ? mealType : "LUNCH";
  }

  private static async createSampleMeals(menuId: string) {
    console.log("🔧 Creating sample meals for menu:", menuId);

    const sampleMeals = [
      {
        menu_id: menuId,
        name: "ארוחת בוקר מזינה",
        meal_type: "BREAKFAST",
        day_number: 1,
        calories: 400,
        protein: 20,
        carbs: 45,
        fat: 15,
        fiber: 8,
        prep_time_minutes: 15,
        cooking_method: "מחבת",
        instructions: "מכינים חביתת ביצים עם ירקות ולחם מלא",
      },
      {
        menu_id: menuId,
        name: "ארוחת צהריים מאוזנת",
        meal_type: "LUNCH",
        day_number: 1,
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 18,
        fiber: 10,
        prep_time_minutes: 25,
        cooking_method: "צלייה ובישול",
        instructions: "חזה עוף צלוי עם אורז וירקות מבושלים",
      },
      {
        menu_id: menuId,
        name: "ארוחת ערב קלה",
        meal_type: "DINNER",
        day_number: 1,
        calories: 450,
        protein: 25,
        carbs: 40,
        fat: 20,
        fiber: 12,
        prep_time_minutes: 20,
        cooking_method: "אפייה",
        instructions: "דג אפוי עם תפוחי אדמה וסלט",
      },
    ];

    // Create meals and their ingredients
    for (const mealData of sampleMeals) {
      const meal = await prisma.recommendedMeal.create({ data: mealData });

      // Add sample ingredients for each meal
      const sampleIngredients = [
        {
          meal_id: meal.meal_id,
          name: "רכיב עיקרי",
          quantity: 100,
          unit: "גרם",
          category: "protein",
          estimated_cost: 5.0,
        },
        {
          meal_id: meal.meal_id,
          name: "רכיב משני",
          quantity: 50,
          unit: "גרם",
          category: "vegetables",
          estimated_cost: 2.0,
        },
      ];

      for (const ingredient of sampleIngredients) {
        await prisma.recommendedIngredient.create({ data: ingredient });
      }
    }

    console.log("✅ Sample meals with ingredients created");
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

    // Generate a replacement meal using AI or fallback
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
    // Enhanced replacement logic with multiple options
    const replacementOptions = [
      {
        name: "חביתה עם ירקות ואבוקדו",
        calories: currentMeal.calories,
        protein: currentMeal.protein,
        carbs: currentMeal.carbs,
        fat: currentMeal.fat,
        fiber: currentMeal.fiber,
        prep_time_minutes: 15,
        cooking_method: "מחבת",
        instructions: "מכינים חביתה עם ירקות טריים ואבוקדו",
        ingredients: [
          {
            name: "ביצים",
            quantity: 2,
            unit: "יחידות",
            category: "protein",
            estimated_cost: 3.0,
          },
          {
            name: "ירקות מעורבים",
            quantity: 100,
            unit: "גרם",
            category: "vegetables",
            estimated_cost: 2.5,
          },
          {
            name: "אבוקדו",
            quantity: 50,
            unit: "גרם",
            category: "fats",
            estimated_cost: 4.0,
          },
        ],
      },
      {
        name: "סלט קינואה עם חלבון",
        calories: currentMeal.calories,
        protein: currentMeal.protein,
        carbs: currentMeal.carbs,
        fat: currentMeal.fat,
        fiber: currentMeal.fiber,
        prep_time_minutes: 20,
        cooking_method: "בישול וערבוב",
        instructions: "מבשלים קינואה ומערבבים עם ירקות וחלבון",
        ingredients: [
          {
            name: "קינואה",
            quantity: 60,
            unit: "גרם",
            category: "grains",
            estimated_cost: 4.0,
          },
          {
            name: "גבינת קוטג'",
            quantity: 80,
            unit: "גרם",
            category: "protein",
            estimated_cost: 4.5,
          },
          {
            name: "ירקות עלים",
            quantity: 100,
            unit: "גרם",
            category: "vegetables",
            estimated_cost: 3.0,
          },
        ],
      },
    ];

    return replacementOptions[
      Math.floor(Math.random() * replacementOptions.length)
    ];
  }

  static async markMealAsFavorite(
    userId: string,
    menuId: string,
    mealId: string,
    isFavorite: boolean
  ) {
    console.log("❤️ Marking meal as favorite:", mealId, isFavorite);
    // Implementation would go here - could create a UserMealPreference record
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
    // Implementation would go here - could store in UserMealPreference
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
    let totalCost = 0;

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
        totalCost += ingredient.estimated_cost || 0;
      });
    });

    // Group by category
    const categorizedList: { [key: string]: any[] } = {};
    Array.from(shoppingList.values()).forEach((item: any) => {
      if (!categorizedList[item.category]) {
        categorizedList[item.category] = [];
      }
      categorizedList[item.category].push(item);
    });

    return {
      menu_id: menuId,
      total_estimated_cost: totalCost,
      categories: categorizedList,
      generated_at: new Date().toISOString(),
    };
  }

  static async startMenuToday(userId: string, menuId: string) {
    console.log("🚀 Starting menu today:", menuId);
    // Implementation could track menu usage, set active status, etc.
    console.log(`Menu ${menuId} started for user ${userId}`);
  }
}
