import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MealAnalysisResult {
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence: number;
  ingredients?: string[];
  servingSize?: string;
  cookingMethod?: string;
  healthNotes?: string;
  items?: any[];
  healthScore?: number;
  recommendations?: string[];
}

export interface MealPlanRequest {
  age: number;
  weight_kg: number;
  height_cm: number;
  target_calories_daily: number;
  target_protein_daily: number;
  target_carbs_daily: number;
  target_fats_daily: number;
  meals_per_day: number;
  snacks_per_day: number;
  rotation_frequency_days: number;
  include_leftovers: boolean;
  fixed_meal_times: boolean;
  dietary_preferences: string[];
  excluded_ingredients: string[];
  allergies: any[];
  physical_activity_level: string;
  sport_frequency: string;
  main_goal: string;
  dietary_preferences_questionnaire: any[];
  avoided_foods: any[];
  meal_texture_preference?: string;
  cooking_skill_level: string;
  available_cooking_time: string;
  kitchen_equipment: string[];
}

export interface ReplacementMealRequest {
  current_meal: {
    name: string;
    meal_timing: string;
    dietary_category: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  };
  user_preferences: {
    dietary_preferences: string[];
    excluded_ingredients: string[];
    allergies: any[];
    preferred_dietary_category?: string;
    max_prep_time?: number;
  };
  nutrition_targets: {
    target_calories: number;
    target_protein: number;
  };
}

export interface MealPlanResponse {
  weekly_plan: {
    day: string;
    day_index: number;
    meals: {
      name: string;
      description: string;
      meal_timing: string;
      dietary_category: string;
      prep_time_minutes: number;
      difficulty_level: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      fiber_g: number;
      sugar_g: number;
      sodium_mg: number;
      ingredients: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
      }[];
      instructions: {
        step: number;
        text: string;
      }[];
      allergens: string[];
      image_url: string;
      portion_multiplier: number;
      is_optional: boolean;
    }[];
  }[];
  weekly_nutrition_summary: {
    avg_daily_calories: number;
    avg_daily_protein: number;
    avg_daily_carbs: number;
    avg_daily_fats: number;
    goal_adherence_percentage: number;
  };
  shopping_tips: string[];
  meal_prep_suggestions: string[];
}

export class OpenAIService {
  static async analyzeMealImage(
    imageBase64: string,
    language: string = "english",
    updateText?: string
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🤖 Starting OpenAI meal analysis...");

      const systemPrompt = `You are a professional nutritionist and food analyst. Analyze the food image and provide detailed nutritional information.

IMPORTANT INSTRUCTIONS:
1. Analyze the food items visible in the image
2. Estimate portion sizes based on visual cues
3. Provide accurate nutritional values per serving shown
4. If multiple items, sum up the total nutrition
5. Be conservative with estimates - better to underestimate than overestimate
6. Consider cooking methods that affect nutrition
7. Account for added oils, sauces, and seasonings visible

${
  updateText
    ? `ADDITIONAL CONTEXT: The user provided this additional information: "${updateText}". Please incorporate this into your analysis and adjust nutritional values accordingly.`
    : ""
}

Respond with a JSON object containing:
{
  "name": "Brief descriptive name of the meal/food",
  "description": "Detailed description of what you see",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": number,
  "ingredients": ["list", "of", "main", "ingredients"],
  "servingSize": "description of portion size",
  "cookingMethod": "how the food appears to be prepared",
  "healthNotes": "brief health assessment or notes"
}

Language for response: ${language}`;

      const userPrompt = updateText
        ? `Please analyze this food image. Additional context: ${updateText}`
        : "Please analyze this food image and provide detailed nutritional information.";

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Updated to current model
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI raw response:", content);

      // Parse JSON response
      let analysisResult: MealAnalysisResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        analysisResult = {
          name: parsed.name || "Unknown Food",
          description: parsed.description || "",
          calories: Math.max(0, Number(parsed.calories) || 0),
          protein: Math.max(0, Number(parsed.protein) || 0),
          carbs: Math.max(0, Number(parsed.carbs) || 0),
          fat: Math.max(0, Number(parsed.fat) || 0),
          fiber: parsed.fiber ? Math.max(0, Number(parsed.fiber)) : undefined,
          sugar: parsed.sugar ? Math.max(0, Number(parsed.sugar)) : undefined,
          sodium: parsed.sodium
            ? Math.max(0, Number(parsed.sodium))
            : undefined,
          confidence: Math.min(
            100,
            Math.max(0, Number(parsed.confidence) || 75)
          ),
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : [],
          servingSize: parsed.servingSize || "1 serving",
          cookingMethod: parsed.cookingMethod || "Unknown",
          healthNotes: parsed.healthNotes || "",
        };
      } catch (parseError) {
        console.error("💥 Failed to parse OpenAI response:", parseError);
        console.error("📄 Raw content:", content);

        analysisResult = {
          name: "Food Item",
          description: "Unable to fully analyze the image",
          calories: 300,
          protein: 15,
          carbs: 30,
          fat: 10,
          confidence: 50,
          ingredients: ["Unknown"],
          servingSize: "1 serving",
          cookingMethod: "Unknown",
          healthNotes: "Analysis incomplete - please try again",
        };
      }

      console.log("✅ Analysis completed:", analysisResult);
      return analysisResult;
    } catch (error) {
      console.error("💥 OpenAI analysis error:", error);

      return {
        name: "Food Item",
        description: "Unable to analyze the image",
        calories: 250,
        protein: 12,
        carbs: 25,
        fat: 8,
        confidence: 30,
        ingredients: ["Unknown"],
        servingSize: "1 serving",
        cookingMethod: "Unknown",
        healthNotes: "Analysis failed - please try again",
      };
    }
  }

  static async updateMealAnalysis(
    originalAnalysis: MealAnalysisResult,
    updateText: string,
    language: string = "english"
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🔄 Updating meal analysis with additional info...");

      const systemPrompt = `You are a professional nutritionist. The user has provided additional information about their meal. Update the nutritional analysis accordingly.

ORIGINAL ANALYSIS:
${JSON.stringify(originalAnalysis, null, 2)}

ADDITIONAL INFORMATION FROM USER:
"${updateText}"

Please provide an updated nutritional analysis that incorporates this new information. Adjust calories, macronutrients, and other values as needed.

Respond with a JSON object in the same format as the original analysis.

Language for response: ${language}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please update the nutritional analysis based on this additional information: "${updateText}"`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        const updatedResult: MealAnalysisResult = {
          name: parsed.name || originalAnalysis.name,
          description: parsed.description || originalAnalysis.description,
          calories: Math.max(
            0,
            Number(parsed.calories) || originalAnalysis.calories
          ),
          protein: Math.max(
            0,
            Number(parsed.protein) || originalAnalysis.protein
          ),
          carbs: Math.max(0, Number(parsed.carbs) || originalAnalysis.carbs),
          fat: Math.max(0, Number(parsed.fat) || originalAnalysis.fat),
          fiber: parsed.fiber
            ? Math.max(0, Number(parsed.fiber))
            : originalAnalysis.fiber,
          sugar: parsed.sugar
            ? Math.max(0, Number(parsed.sugar))
            : originalAnalysis.sugar,
          sodium: parsed.sodium
            ? Math.max(0, Number(parsed.sodium))
            : originalAnalysis.sodium,
          confidence: Math.min(
            100,
            Math.max(
              0,
              Number(parsed.confidence) || originalAnalysis.confidence
            )
          ),
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : originalAnalysis.ingredients,
          servingSize: parsed.servingSize || originalAnalysis.servingSize,
          cookingMethod: parsed.cookingMethod || originalAnalysis.cookingMethod,
          healthNotes: parsed.healthNotes || originalAnalysis.healthNotes,
        };

        console.log("✅ Update completed:", updatedResult);
        return updatedResult;
      } catch (parseError) {
        console.error("💥 Failed to parse update response:", parseError);
        return originalAnalysis;
      }
    } catch (error) {
      console.error("💥 OpenAI update error:", error);
      return originalAnalysis;
    }
  }

  static async generateMealPlan(
    userProfile: MealPlanRequest
  ): Promise<MealPlanResponse> {
    try {
      console.log("🤖 Generating AI meal plan...");

      // Create meal timing array based on user preferences
      const mealTimings = this.generateMealTimings(
        userProfile.meals_per_day,
        userProfile.snacks_per_day
      );

      const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a personalized 7-day meal plan based on the user's profile, preferences, and goals.

CRITICAL REQUIREMENTS:
1. Create exactly 7 days of meals (Sunday through Saturday)
2. Each day should have exactly ${userProfile.meals_per_day} meals and ${
        userProfile.snacks_per_day
      } snacks
3. Use these meal timings: ${mealTimings.join(", ")}
4. All meals must meet the user's dietary restrictions and preferences
5. Avoid all excluded ingredients and allergens: ${userProfile.excluded_ingredients.join(
        ", "
      )}
6. Avoid foods from avoided list: ${userProfile.avoided_foods
        .map((f) => f.name || f)
        .join(", ")}
7. Balance nutrition across the week to meet daily targets
8. Consider cooking skill level: ${userProfile.cooking_skill_level}
9. Available cooking time: ${userProfile.available_cooking_time}
10. Provide detailed recipes with ingredients and instructions
11. Include realistic prep times and difficulty levels
12. Suggest appropriate portion sizes
13. Ensure variety across the week

USER PROFILE:
- Age: ${userProfile.age}
- Weight: ${userProfile.weight_kg}kg
- Height: ${userProfile.height_cm}cm
- Target daily calories: ${userProfile.target_calories_daily}
- Target daily protein: ${userProfile.target_protein_daily}g
- Target daily carbs: ${userProfile.target_carbs_daily}g
- Target daily fats: ${userProfile.target_fats_daily}g
- Dietary preferences: ${userProfile.dietary_preferences.join(", ")}
- Allergies: ${userProfile.allergies.map((a) => a.name || a).join(", ")}
- Activity level: ${userProfile.physical_activity_level}
- Main goal: ${userProfile.main_goal}

MEAL TIMING EXPLANATION:
- BREAKFAST: Morning meal
- LUNCH: Midday meal  
- DINNER: Evening meal
- MORNING_SNACK: Between breakfast and lunch
- AFTERNOON_SNACK: Between lunch and dinner
- EVENING_SNACK: After dinner

DIETARY CATEGORIES:
- BALANCED: Well-rounded nutrition
- VEGETARIAN: No meat, fish allowed
- VEGAN: No animal products
- KETO: Very low carb, high fat
- PALEO: Whole foods, no processed
- MEDITERRANEAN: Mediterranean diet
- LOW_CARB: Reduced carbohydrates
- HIGH_PROTEIN: Increased protein
- GLUTEN_FREE: No gluten
- DAIRY_FREE: No dairy products

You must respond with a valid JSON object in this exact format:
{
  "weekly_plan": [
    {
      "day": "Sunday",
      "day_index": 0,
      "meals": [
        {
          "name": "Meal Name",
          "description": "Brief description of the meal",
          "meal_timing": "BREAKFAST",
          "dietary_category": "BALANCED",
          "prep_time_minutes": 15,
          "difficulty_level": 1,
          "calories": 400,
          "protein_g": 20,
          "carbs_g": 45,
          "fats_g": 15,
          "fiber_g": 8,
          "sugar_g": 10,
          "sodium_mg": 600,
          "ingredients": [
            {
              "name": "Oats",
              "quantity": 50,
              "unit": "g",
              "category": "Grains"
            }
          ],
          "instructions": [
            {
              "step": 1,
              "text": "Detailed cooking instruction"
            }
          ],
          "allergens": [],
          "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
          "portion_multiplier": 1.0,
          "is_optional": false
        }
      ]
    }
  ],
  "weekly_nutrition_summary": {
    "avg_daily_calories": 2000,
    "avg_daily_protein": 150,
    "avg_daily_carbs": 250,
    "avg_daily_fats": 67,
    "goal_adherence_percentage": 95
  },
  "shopping_tips": [
    "Buy seasonal produce for better prices",
    "Prepare proteins in bulk on weekends"
  ],
  "meal_prep_suggestions": [
    "Cook grains in batches",
    "Pre-cut vegetables for quick assembly"
  ]
}

IMPORTANT: 
- Ensure all 7 days are included (Sunday through Saturday)
- Each day must have the correct number of meals and snacks
- All nutritional values must be realistic numbers
- Use realistic Pexels image URLs
- Include complete ingredient lists with quantities
- Provide step-by-step instructions
- Make sure the JSON is valid and complete`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content:
              "Please create my personalized 7-day meal plan based on my profile and preferences. Make sure to include all 7 days with complete meal information.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI meal plan response received");

      // Parse JSON response with better error handling
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const mealPlan = JSON.parse(jsonString);

        // Validate the meal plan structure
        if (!mealPlan.weekly_plan || !Array.isArray(mealPlan.weekly_plan)) {
          throw new Error(
            "Invalid meal plan structure: missing weekly_plan array"
          );
        }

        if (mealPlan.weekly_plan.length !== 7) {
          throw new Error(
            `Expected 7 days, got ${mealPlan.weekly_plan.length}`
          );
        }

        // Validate each day has the correct number of meals
        for (const day of mealPlan.weekly_plan) {
          if (!day.meals || !Array.isArray(day.meals)) {
            throw new Error(`Day ${day.day} missing meals array`);
          }

          const expectedMealsCount =
            userProfile.meals_per_day + userProfile.snacks_per_day;
          if (day.meals.length !== expectedMealsCount) {
            console.warn(
              `Day ${day.day} has ${day.meals.length} meals, expected ${expectedMealsCount}`
            );
          }
        }

        console.log("✅ AI meal plan generated and validated successfully");
        return mealPlan as MealPlanResponse;
      } catch (parseError) {
        console.error("💥 Failed to parse meal plan response:", parseError);
        console.error("📄 Raw content:", content);

        // Return a fallback meal plan
        return this.generateFallbackMealPlan(userProfile);
      }
    } catch (error) {
      console.error("💥 OpenAI meal plan generation error:", error);

      // Return a fallback meal plan
      return this.generateFallbackMealPlan(userProfile);
    }
  }

  static async generateReplacementMeal(
    request: ReplacementMealRequest
  ): Promise<any> {
    try {
      console.log("🔄 Generating AI replacement meal...");

      const systemPrompt = `You are a professional nutritionist. Generate a replacement meal that is similar to the current meal but meets the user's specific preferences and requirements.

CURRENT MEAL TO REPLACE:
${JSON.stringify(request.current_meal, null, 2)}

USER PREFERENCES:
- Dietary preferences: ${request.user_preferences.dietary_preferences.join(
        ", "
      )}
- Excluded ingredients: ${request.user_preferences.excluded_ingredients.join(
        ", "
      )}
- Allergies: ${request.user_preferences.allergies
        .map((a) => a.name || a)
        .join(", ")}
- Preferred dietary category: ${
        request.user_preferences.preferred_dietary_category || "Any"
      }
- Max prep time: ${request.user_preferences.max_prep_time || "No limit"} minutes

NUTRITION TARGETS:
- Target calories: ${request.nutrition_targets.target_calories}
- Target protein: ${request.nutrition_targets.target_protein}g

REQUIREMENTS:
1. Keep the same meal timing as the original
2. Maintain similar calorie and protein content (±20%)
3. Respect all dietary preferences and restrictions
4. Avoid all excluded ingredients and allergens
5. Consider the preferred dietary category if specified
6. Respect maximum prep time if specified
7. Provide a complete recipe with ingredients and instructions

Respond with a valid JSON object in this exact format:
{
  "name": "New Meal Name",
  "description": "Brief description of the replacement meal",
  "meal_timing": "${request.current_meal.meal_timing}",
  "dietary_category": "BALANCED",
  "prep_time_minutes": 20,
  "difficulty_level": 2,
  "calories": 400,
  "protein_g": 25,
  "carbs_g": 35,
  "fats_g": 15,
  "fiber_g": 8,
  "sugar_g": 5,
  "sodium_mg": 600,
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": 100,
      "unit": "g",
      "category": "Protein"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Detailed cooking instruction"
    }
  ],
  "allergens": [],
  "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  "replacement_reason": "Brief explanation of why this is a good replacement"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content:
              "Please generate a suitable replacement meal based on my preferences and requirements.",
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI replacement meal response received");

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const replacementMeal = JSON.parse(jsonString);

        // Validate required fields
        if (!replacementMeal.name || !replacementMeal.meal_timing) {
          throw new Error("Missing required fields in replacement meal");
        }

        console.log("✅ AI replacement meal generated successfully");
        return replacementMeal;
      } catch (parseError) {
        console.error(
          "💥 Failed to parse replacement meal response:",
          parseError
        );
        console.error("📄 Raw content:", content);

        // Return a fallback replacement meal
        return this.generateFallbackReplacementMeal(request);
      }
    } catch (error) {
      console.error("💥 OpenAI replacement meal generation error:", error);

      // Return a fallback replacement meal
      return this.generateFallbackReplacementMeal(request);
    }
  }

  // Helper methods
  private static generateMealTimings(
    mealsPerDay: number,
    snacksPerDay: number
  ): string[] {
    const timings: string[] = [];

    // Always include main meals based on meals_per_day
    if (mealsPerDay >= 1) timings.push("BREAKFAST");
    if (mealsPerDay >= 2) timings.push("LUNCH");
    if (mealsPerDay >= 3) timings.push("DINNER");

    // Add snacks based on snacks_per_day
    if (snacksPerDay >= 1) timings.push("MORNING_SNACK");
    if (snacksPerDay >= 2) timings.push("AFTERNOON_SNACK");
    if (snacksPerDay >= 3) timings.push("EVENING_SNACK");

    return timings;
  }

  private static generateFallbackMealPlan(
    userProfile: MealPlanRequest
  ): MealPlanResponse {
    console.log("🆘 Generating fallback meal plan...");

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mealTimings = this.generateMealTimings(
      userProfile.meals_per_day,
      userProfile.snacks_per_day
    );

    const weeklyPlan = days.map((day, index) => ({
      day,
      day_index: index,
      meals: mealTimings.map((timing, mealIndex) => ({
        name: `${
          timing.charAt(0) + timing.slice(1).toLowerCase().replace("_", " ")
        } ${index + 1}`,
        description: `A nutritious ${timing
          .toLowerCase()
          .replace("_", " ")} meal`,
        meal_timing: timing,
        dietary_category: "BALANCED",
        prep_time_minutes: 15,
        difficulty_level: 1,
        calories: Math.round(
          userProfile.target_calories_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        protein_g: Math.round(
          userProfile.target_protein_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        carbs_g: Math.round(
          userProfile.target_carbs_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        fats_g: Math.round(
          userProfile.target_fats_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        fiber_g: 5,
        sugar_g: 8,
        sodium_mg: 400,
        ingredients: [
          {
            name: "Mixed ingredients",
            quantity: 100,
            unit: "g",
            category: "Mixed",
          },
        ],
        instructions: [
          {
            step: 1,
            text: "Prepare according to your preferences",
          },
        ],
        allergens: [],
        image_url:
          "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
        portion_multiplier: 1.0,
        is_optional: false,
      })),
    }));

    return {
      weekly_plan: weeklyPlan,
      weekly_nutrition_summary: {
        avg_daily_calories: userProfile.target_calories_daily,
        avg_daily_protein: userProfile.target_protein_daily,
        avg_daily_carbs: userProfile.target_carbs_daily,
        avg_daily_fats: userProfile.target_fats_daily,
        goal_adherence_percentage: 80,
      },
      shopping_tips: [
        "Plan your shopping list based on the weekly meals",
        "Buy seasonal produce for better prices",
      ],
      meal_prep_suggestions: [
        "Prepare ingredients in advance",
        "Cook proteins in bulk",
      ],
    };
  }

  private static generateFallbackReplacementMeal(
    request: ReplacementMealRequest
  ): any {
    console.log("🆘 Generating fallback replacement meal...");

    return {
      name: `Alternative ${request.current_meal.name}`,
      description: `A replacement meal similar to ${request.current_meal.name}`,
      meal_timing: request.current_meal.meal_timing,
      dietary_category: request.current_meal.dietary_category,
      prep_time_minutes: 20,
      difficulty_level: 2,
      calories: request.current_meal.calories || 400,
      protein_g: request.current_meal.protein_g || 25,
      carbs_g: request.current_meal.carbs_g || 35,
      fats_g: request.current_meal.fats_g || 15,
      fiber_g: 8,
      sugar_g: 5,
      sodium_mg: 600,
      ingredients: [
        {
          name: "Alternative ingredients",
          quantity: 100,
          unit: "g",
          category: "Mixed",
        },
      ],
      instructions: [
        {
          step: 1,
          text: "Prepare according to your dietary preferences",
        },
      ],
      allergens: [],
      image_url:
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      replacement_reason:
        "Generated as a safe alternative when AI generation fails",
    };
  }
}
