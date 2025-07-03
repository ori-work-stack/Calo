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

  // Add missing fields here if you access them anywhere in your code:
  items?: any[]; // if your code expects an 'items' array
  healthScore?: number; // if you use a healthScore value
  recommendations?: string[]; // if you have recommendations list
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

export class OpenAIService {
  static async analyzeMealImage(
    imageBase64: string,
    language: string = "english",
    updateText?: string
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🤖 Starting OpenAI meal analysis...");
      console.log("📊 Image data length:", imageBase64.length);
      console.log("🌍 Language:", language);
      console.log("📝 Update text:", updateText ? "Provided" : "None");

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
  "calories": number (total calories for the portion shown),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams, optional),
  "sugar": number (grams, optional),
  "sodium": number (milligrams, optional),
  "confidence": number (0-100, how confident you are in the analysis),
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
        model: "gpt-4-vision-preview",
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
        temperature: 0.1, // Low temperature for consistent results
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI raw response:", content);

      // Parse JSON response
      let analysisResult: MealAnalysisResult;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        const parsed = JSON.parse(jsonString);

        // Validate and sanitize the response
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

        // Fallback analysis
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

      // Return fallback result instead of throwing
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
      console.log("📝 Update text:", updateText);

      const systemPrompt = `You are a professional nutritionist. The user has provided additional information about their meal. Update the nutritional analysis accordingly.

ORIGINAL ANALYSIS:
${JSON.stringify(originalAnalysis, null, 2)}

ADDITIONAL INFORMATION FROM USER:
"${updateText}"

Please provide an updated nutritional analysis that incorporates this new information. Adjust calories, macronutrients, and other values as needed.

Respond with a JSON object in the same format as the original analysis.

Language for response: ${language}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
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

      console.log("🤖 OpenAI update response:", content);

      // Parse JSON response
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
        // Return original analysis if update fails
        return originalAnalysis;
      }
    } catch (error) {
      console.error("💥 OpenAI update error:", error);
      // Return original analysis if update fails
      return originalAnalysis;
    }
  }

  static async generateMealPlan(userProfile: MealPlanRequest): Promise<any> {
    try {
      console.log("🤖 Generating AI meal plan...");

      const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a personalized 7-day meal plan based on the user's profile, preferences, and goals.

CRITICAL REQUIREMENTS:
1. Create exactly 7 days of meals (Sunday through Saturday)
2. Each day should have the specified number of meals and snacks
3. All meals must meet the user's dietary restrictions and preferences
4. Avoid all excluded ingredients and allergens
5. Balance nutrition across the week to meet daily targets
6. Consider cooking skill level and available time
7. Provide detailed recipes with ingredients and instructions
8. Include realistic prep times and difficulty levels
9. Suggest appropriate portion sizes
10. Ensure variety across the week

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Respond with a JSON object containing:
{
  "weekly_plan": [
    {
      "day": "Sunday",
      "day_index": 0,
      "meals": [
        {
          "name": "Meal name",
          "description": "Brief description",
          "meal_timing": "BREAKFAST|LUNCH|DINNER|MORNING_SNACK|AFTERNOON_SNACK",
          "dietary_category": "VEGETARIAN|VEGAN|KETO|PALEO|MEDITERRANEAN|LOW_CARB|HIGH_PROTEIN|GLUTEN_FREE|DAIRY_FREE|BALANCED",
          "prep_time_minutes": number,
          "difficulty_level": 1-3 (1=easy, 2=medium, 3=hard),
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fats_g": number,
          "fiber_g": number,
          "sugar_g": number,
          "sodium_mg": number,
          "ingredients": [
            {
              "name": "ingredient name",
              "quantity": number,
              "unit": "g|ml|tbsp|tsp|cup|piece|slice",
              "category": "Protein|Produce|Grains|Dairy|Oils|Spices|Condiments|Nuts|Seeds"
            }
          ],
          "instructions": [
            {
              "step": 1,
              "text": "Step description"
            }
          ],
          "allergens": ["gluten", "dairy", "nuts", "eggs", "fish", "shellfish", "soy", "sesame"],
          "image_url": "https://images.pexels.com/photos/[relevant-food-photo-id]/pexels-photo-[id].jpeg",
          "portion_multiplier": 1.0,
          "is_optional": false
        }
      ]
    }
  ],
  "weekly_nutrition_summary": {
    "avg_daily_calories": number,
    "avg_daily_protein": number,
    "avg_daily_carbs": number,
    "avg_daily_fats": number,
    "goal_adherence_percentage": number
  },
  "shopping_tips": [
    "Practical shopping and meal prep tips"
  ],
  "meal_prep_suggestions": [
    "Suggestions for batch cooking and preparation"
  ]
}

IMPORTANT: Use realistic Pexels image URLs for food photos. Make sure all meals are practical, achievable, and aligned with the user's goals and preferences.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content:
              "Please create my personalized 7-day meal plan based on my profile and preferences.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.3, // Slightly higher for creativity while maintaining consistency
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI meal plan response received");

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const mealPlan = JSON.parse(jsonString);

        console.log("✅ AI meal plan generated successfully");
        return mealPlan;
      } catch (parseError) {
        console.error("💥 Failed to parse meal plan response:", parseError);
        console.error("📄 Raw content:", content);
        throw new Error("Failed to parse AI meal plan response");
      }
    } catch (error) {
      console.error("💥 OpenAI meal plan generation error:", error);
      throw error;
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
${JSON.stringify(request.user_preferences, null, 2)}

NUTRITION TARGETS:
${JSON.stringify(request.nutrition_targets, null, 2)}

REQUIREMENTS:
1. Keep the same meal timing as the original
2. Maintain similar calorie and protein content (±20%)
3. Respect all dietary preferences and restrictions
4. Avoid all excluded ingredients and allergens
5. Consider the preferred dietary category if specified
6. Respect maximum prep time if specified
7. Provide a complete recipe with ingredients and instructions

Respond with a JSON object containing:
{
  "name": "New meal name",
  "description": "Brief description",
  "meal_timing": "same as original",
  "dietary_category": "appropriate category",
  "prep_time_minutes": number,
  "difficulty_level": 1-3,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "fiber_g": number,
  "sugar_g": number,
  "sodium_mg": number,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "g|ml|tbsp|tsp|cup|piece|slice",
      "category": "Protein|Produce|Grains|Dairy|Oils|Spices|Condiments|Nuts|Seeds"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Step description"
    }
  ],
  "allergens": ["list of allergens"],
  "image_url": "https://images.pexels.com/photos/[relevant-food-photo-id]/pexels-photo-[id].jpeg",
  "replacement_reason": "Brief explanation of why this is a good replacement"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
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

        console.log("✅ AI replacement meal generated successfully");
        return replacementMeal;
      } catch (parseError) {
        console.error(
          "💥 Failed to parse replacement meal response:",
          parseError
        );
        console.error("📄 Raw content:", content);
        throw new Error("Failed to parse AI replacement meal response");
      }
    } catch (error) {
      console.error("💥 OpenAI replacement meal generation error:", error);
      throw error;
    }
  }
}
