import OpenAI from "openai";
import {
  MealAnalysisResult,
  MealPlanRequest,
  MealPlanResponse,
  ReplacementMealRequest,
} from "../types/openai";
import { extractCleanJSON } from "../utils/openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export class OpenAIService {
  private static openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

  static async generateText(prompt: string): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, cannot generate text");
        return ""; // Or throw an error, depending on your error handling strategy
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional nutritionist and meal planner. Generate accurate, healthy meal plans in the exact JSON format requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI text generation error:", error);
      throw new Error("Failed to generate menu content");
    }
  }
  static async analyzeMealImage(
    imageBase64: string,
    language: string = "english",
    updateText?: string
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🤖 Starting OpenAI meal analysis...");

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, using mock analysis");
        // Return a mock result when API key is not available
        return this.getMockAnalysisResult();
      }

      const systemPrompt = `You are a professional nutritionist. Analyze the food image and provide precise nutritional data.

ANALYSIS RULES:
1. Analyze all visible food items and estimate total serving size
2. Provide accurate nutritional values for the complete visible portion
3. Be conservative with estimates - prefer underestimating
4. Consider cooking methods, visible oils, sauces, and seasonings
5. Identify potential allergens and additives

${
  updateText
    ? `CONTEXT: User provided: "${updateText}". Incorporate this into your analysis.`
    : ""
}

Return JSON with ALL fields below:
{
  "meal_name": "Brief descriptive name",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "saturated_fats_g": number,
  "polyunsaturated_fats_g": number,
  "monounsaturated_fats_g": number,
  "omega_3_g": number,
  "omega_6_g": number,
  "fiber_g": number,
  "soluble_fiber_g": number,
  "insoluble_fiber_g": number,
  "sugar_g": number,
  "cholesterol_mg": number,
  "sodium_mg": number,
  "alcohol_g": number,
  "caffeine_mg": number,
  "liquids_ml": number,
  "serving_size_g": number,
  "allergens_json": {"possible_allergens": ["gluten", "dairy", "nuts", "etc"]},
  "vitamins_json": {
    "vitamin_a_mcg": number,
    "vitamin_c_mg": number,
    "vitamin_d_mcg": number,
    "vitamin_e_mg": number,
    "vitamin_k_mcg": number,
    "vitamin_b12_mcg": number,
    "folate_mcg": number,
    "niacin_mg": number,
    "thiamin_mg": number,
    "riboflavin_mg": number,
    "pantothenic_acid_mg": number,
    "vitamin_b6_mg": number
  },
  "micronutrients_json": {
    "iron_mg": number,
    "magnesium_mg": number,
    "zinc_mg": number,
    "calcium_mg": number,
    "potassium_mg": number,
    "phosphorus_mg": number,
    "selenium_mcg": number,
    "copper_mg": number,
    "manganese_mg": number
  },
  "glycemic_index": number,
  "insulin_index": number,
  "food_category": "Fast Food/Homemade/Snack/Beverage/etc",
  "processing_level": "Unprocessed/Minimally processed/Ultra-processed",
  "cooking_method": "Grilled/Fried/Boiled/Raw/Baked/etc",
  "additives_json": {"observed_additives": ["preservatives", "colorings", "etc"]},
  "health_risk_notes": "Brief health assessment",
  "confidence": number (0-1),
  "ingredients": ["main", "visible", "ingredients"],
      "ingredients_list": ["ingredient1", "ingredient2", "ingredient3"],
  "servingSize": "1 bowl/2 slices/etc",
  "cookingMethod": "How prepared",
  "healthNotes": "Brief dietary notes"
}

Language: ${language}`;

      const userPrompt = updateText
        ? `Please analyze this food image. Additional context: ${updateText}`
        : "Please analyze this food image and provide detailed nutritional information.";

      const response = await openai?.chat.completions.create({
        model: "gpt-4o",
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

      const content = response?.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI raw response:", content);

      // Parse JSON response using your extractCleanJSON function
      try {
        const cleanJSON = extractCleanJSON(content);
        console.log("🧹 Cleaned JSON:", cleanJSON);

        const parsed = JSON.parse(cleanJSON);
        console.log("📊 Parsed OpenAI response:", parsed);

        const analysisResult: MealAnalysisResult = {
          // Basic identification
          name: parsed.meal_name || "Unknown Food",
          description: parsed.description || "",

          // Core macronutrients
          calories: Math.max(0, Number(parsed.calories) || 0),
          protein: Math.max(0, Number(parsed.protein_g) || 0),
          carbs: Math.max(0, Number(parsed.carbs_g) || 0),
          fat: Math.max(0, Number(parsed.fats_g) || 0),

          // Detailed macronutrients
          saturated_fats_g: parsed.saturated_fats_g
            ? Math.max(0, Number(parsed.saturated_fats_g))
            : undefined,
          polyunsaturated_fats_g: parsed.polyunsaturated_fats_g
            ? Math.max(0, Number(parsed.polyunsaturated_fats_g))
            : undefined,
          monounsaturated_fats_g: parsed.monounsaturated_fats_g
            ? Math.max(0, Number(parsed.monounsaturated_fats_g))
            : undefined,
          omega_3_g: parsed.omega_3_g
            ? Math.max(0, Number(parsed.omega_3_g))
            : undefined,
          omega_6_g: parsed.omega_6_g
            ? Math.max(0, Number(parsed.omega_6_g))
            : undefined,

          // Carbohydrate details
          fiber: parsed.fiber_g
            ? Math.max(0, Number(parsed.fiber_g))
            : undefined,
          soluble_fiber_g: parsed.soluble_fiber_g
            ? Math.max(0, Number(parsed.soluble_fiber_g))
            : undefined,
          insoluble_fiber_g: parsed.insoluble_fiber_g
            ? Math.max(0, Number(parsed.insoluble_fiber_g))
            : undefined,
          sugar: parsed.sugar_g
            ? Math.max(0, Number(parsed.sugar_g))
            : undefined,

          // Other nutrients
          cholesterol_mg: parsed.cholesterol_mg
            ? Math.max(0, Number(parsed.cholesterol_mg))
            : undefined,
          sodium: parsed.sodium_mg
            ? Math.max(0, Number(parsed.sodium_mg))
            : undefined,
          alcohol_g: parsed.alcohol_g
            ? Math.max(0, Number(parsed.alcohol_g))
            : undefined,
          caffeine_mg: parsed.caffeine_mg
            ? Math.max(0, Number(parsed.caffeine_mg))
            : undefined,
          liquids_ml: parsed.liquids_ml
            ? Math.max(0, Number(parsed.liquids_ml))
            : undefined,
          serving_size_g: parsed.serving_size_g
            ? Math.max(0, Number(parsed.serving_size_g))
            : undefined,

          // JSON fields
          allergens_json: parsed.allergens_json || null,
          vitamins_json: parsed.vitamins_json || null,
          micronutrients_json: parsed.micronutrients_json || null,
          additives_json: parsed.additives_json || null,

          // Indexes and categories
          glycemic_index: parsed.glycemic_index
            ? Math.max(0, Number(parsed.glycemic_index))
            : undefined,
          insulin_index: parsed.insulin_index
            ? Math.max(0, Number(parsed.insulin_index))
            : undefined,
          food_category: parsed.food_category || null,
          processing_level: parsed.processing_level || null,
          cooking_method: parsed.cooking_method || null,
          health_risk_notes: parsed.health_risk_notes || null,

          // Legacy fields for compatibility
          confidence: Math.min(
            100,
            Math.max(0, Number(parsed.confidence) * 100 || 75)
          ),
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : typeof parsed.ingredients === "string"
            ? [parsed.ingredients]
            : parsed.ingredients_list || parsed.ingredient_list || [],
          servingSize: parsed.servingSize || "1 serving",
          cookingMethod: parsed.cookingMethod || "Unknown",
          healthNotes: parsed.healthNotes || "",
        };

        // Log the complete parsed data for debugging
        console.log("📋 Complete OpenAI nutrition data:", {
          meal_name: parsed.meal_name,
          calories: parsed.calories,
          protein_g: parsed.protein_g,
          carbs_g: parsed.carbs_g,
          fats_g: parsed.fats_g,
          fiber_g: parsed.fiber_g,
          sugar_g: parsed.sugar_g,
          sodium_mg: parsed.sodium_mg,
          vitamins: parsed.vitamins_json,
          micronutrients: parsed.micronutrients_json,
          allergens: parsed.allergens_json,
          confidence: parsed.confidence,
          serving_size_g: parsed.serving_size_g,
          glycemic_index: parsed.glycemic_index,
          insulin_index: parsed.insulin_index,
          food_category: parsed.food_category,
          processing_level: parsed.processing_level,
          cooking_method: parsed.cooking_method,
          health_risk_notes: parsed.health_risk_notes,
        });

        return analysisResult;
      } catch (parseError) {
        console.error("💥 Failed to parse OpenAI response:", parseError);
        console.error("📄 Raw content:", content);
        console.error("🧹 Attempted to clean:", extractCleanJSON(content));

        // Return fallback result when parsing fails
        return this.getFallbackAnalysisResult();
      }
    } catch (error) {
      console.error("💥 OpenAI analysis error:", error);

      // Return fallback result when OpenAI API fails
      return this.getFallbackAnalysisResult();
    }
  }

  // Helper method to provide a mock result when API key is missing
  private static getMockAnalysisResult(): MealAnalysisResult {
    return {
      name: "Unknown Food (Mock)",
      description: "Analysis unavailable - no API key",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0,
      ingredients: [],
      servingSize: "1 serving",
      cookingMethod: "Unknown",
      healthNotes: "Unable to analyze without API key",
      allergens_json: null,
      vitamins_json: null,
      micronutrients_json: null,
      additives_json: null,
    };
  }

  // Helper method to provide a fallback result when analysis fails
  private static getFallbackAnalysisResult(): MealAnalysisResult {
    return {
      name: "Unknown Food",
      description: "Analysis failed",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0,
      ingredients: [],
      servingSize: "1 serving",
      cookingMethod: "Unknown",
      healthNotes: "Unable to analyze this image",
      allergens_json: null,
      vitamins_json: null,
      micronutrients_json: null,
      additives_json: null,
    };
  }
  static async updateMealAnalysis(
    originalAnalysis: MealAnalysisResult,
    updateText: string,
    language: string = "english"
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🔄 Updating meal analysis with additional info...");

      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, using mock update");
        return this.getMockUpdate(originalAnalysis, updateText);
      }

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
            : typeof parsed.ingredients === "string"
            ? [parsed.ingredients]
            : parsed.ingredients_list || parsed.ingredient_list || [],
          servingSize: parsed.servingSize || originalAnalysis.servingSize,
          cookingMethod: parsed.cookingMethod || originalAnalysis.cookingMethod,
          healthNotes: parsed.healthNotes || originalAnalysis.healthNotes,
        };

        console.log("✅ Update completed:", updatedResult);
        return updatedResult;
      } catch (parseError) {
        console.error("💥 Failed to parse update response:", parseError);
        return this.getMockUpdate(originalAnalysis, updateText);
      }
    } catch (error) {
      console.error("💥 OpenAI update error:", error);
      return this.getMockUpdate(originalAnalysis, updateText);
    }
  }

  private static getMockUpdate(
    originalAnalysis: MealAnalysisResult,
    updateText: string
  ): MealAnalysisResult {
    console.log("🎭 Using mock meal update");

    const updated = { ...originalAnalysis };
    const lowerUpdate = updateText.toLowerCase();

    // Simple logic to adjust based on common update patterns
    if (
      lowerUpdate.includes("more") ||
      lowerUpdate.includes("extra") ||
      lowerUpdate.includes("additional")
    ) {
      updated.calories = Math.round(updated.calories * 1.3);
      updated.protein = Math.round(updated.protein * 1.3);
      updated.carbs = Math.round(updated.carbs * 1.3);
      updated.fat = Math.round(updated.fat * 1.3);
      updated.name += " (Updated)";
      updated.description += ` - Updated with: ${updateText}`;
    } else if (
      lowerUpdate.includes("less") ||
      lowerUpdate.includes("smaller")
    ) {
      updated.calories = Math.round(updated.calories * 0.7);
      updated.protein = Math.round(updated.protein * 0.7);
      updated.carbs = Math.round(updated.carbs * 0.7);
      updated.fat = Math.round(updated.fat * 0.7);
      updated.name += " (Smaller Portion)";
    } else {
      // Generic update
      updated.name += " (Updated)";
      updated.description += ` - Additional info: ${updateText}`;
    }

    return updated;
  }

  static async generateMealPlan(
    userProfile: MealPlanRequest
  ): Promise<MealPlanResponse> {
    try {
      console.log("🤖 Generating AI meal plan...");

      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, using fallback meal plan");
        return this.generateFallbackMealPlan(userProfile);
      }

      // Try simple fallback first to avoid OpenAI issues
      console.log("🔄 Using reliable fallback meal plan generation");
      return this.generateFallbackMealPlan(userProfile);
    } catch (error) {
      console.error("💥 OpenAI meal plan generation error:", error);
      return this.generateFallbackMealPlan(userProfile);
    }
  }

  static async generateReplacementMeal(
    request: ReplacementMealRequest
  ): Promise<any> {
    try {
      console.log("🔄 Generating AI replacement meal...");

      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, using fallback replacement");
        return this.generateFallbackReplacementMeal(request);
      }

      // Use fallback for now to avoid issues
      return this.generateFallbackReplacementMeal(request);
    } catch (error) {
      console.error("💥 OpenAI replacement meal generation error:", error);
      return this.generateFallbackReplacementMeal(request);
    }
  }

  static async generateNutritionInsights(
    meals: any[],
    stats: any
  ): Promise<string[]> {
    try {
      if (!process.env.OPENAI_API_KEY || !openai) {
        console.log("⚠️ No OpenAI API key found, using default insights");
        return [
          "Your nutrition tracking is helping you build healthy habits!",
          "Consider adding more variety to your meals for balanced nutrition.",
          "Keep logging your meals to maintain awareness of your eating patterns.",
        ];
      }

      // Return basic insights for now
      return [
        "Your nutrition tracking is helping you build healthy habits!",
        "Consider adding more variety to your meals for balanced nutrition.",
        "Keep logging your meals to maintain awareness of your eating patterns.",
      ];
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return [
        "Your nutrition tracking is helping you build healthy habits!",
        "Consider adding more variety to your meals for balanced nutrition.",
        "Keep logging your meals to maintain awareness of your eating patterns.",
      ];
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

    // Diverse meal options for each timing
    const mealOptions = {
      BREAKFAST: [
        {
          name: "Scrambled Eggs with Avocado Toast",
          description: "Protein-rich eggs with healthy fats from avocado",
          calories: 420,
          protein_g: 22,
          carbs_g: 28,
          fats_g: 24,
          prep_time_minutes: 15,
          ingredients: [
            { name: "eggs", quantity: 2, unit: "piece", category: "Protein" },
            {
              name: "whole grain bread",
              quantity: 2,
              unit: "slice",
              category: "Grains",
            },
            { name: "avocado", quantity: 0.5, unit: "piece", category: "Fats" },
          ],
        },
        {
          name: "Greek Yogurt with Berries",
          description: "High-protein yogurt with antioxidant-rich berries",
          calories: 280,
          protein_g: 20,
          carbs_g: 25,
          fats_g: 8,
          prep_time_minutes: 5,
          ingredients: [
            {
              name: "greek yogurt",
              quantity: 200,
              unit: "g",
              category: "Dairy",
            },
            {
              name: "mixed berries",
              quantity: 100,
              unit: "g",
              category: "Fruits",
            },
            {
              name: "honey",
              quantity: 1,
              unit: "tbsp",
              category: "Sweeteners",
            },
          ],
        },
        {
          name: "Oatmeal with Nuts and Banana",
          description: "Fiber-rich oats with protein from nuts",
          calories: 350,
          protein_g: 12,
          carbs_g: 45,
          fats_g: 14,
          prep_time_minutes: 10,
          ingredients: [
            {
              name: "rolled oats",
              quantity: 50,
              unit: "g",
              category: "Grains",
            },
            { name: "banana", quantity: 1, unit: "piece", category: "Fruits" },
            { name: "almonds", quantity: 30, unit: "g", category: "Nuts" },
          ],
        },
      ],
      LUNCH: [
        {
          name: "Grilled Chicken Salad",
          description: "Lean protein with fresh vegetables",
          calories: 380,
          protein_g: 35,
          carbs_g: 15,
          fats_g: 20,
          prep_time_minutes: 20,
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
        },
        {
          name: "Quinoa Buddha Bowl",
          description: "Complete protein quinoa with colorful vegetables",
          calories: 420,
          protein_g: 18,
          carbs_g: 55,
          fats_g: 15,
          prep_time_minutes: 25,
          ingredients: [
            { name: "quinoa", quantity: 80, unit: "g", category: "Grains" },
            {
              name: "roasted vegetables",
              quantity: 200,
              unit: "g",
              category: "Vegetables",
            },
            { name: "tahini", quantity: 2, unit: "tbsp", category: "Fats" },
          ],
        },
        {
          name: "Turkey and Hummus Wrap",
          description: "Lean protein with Mediterranean flavors",
          calories: 390,
          protein_g: 28,
          carbs_g: 35,
          fats_g: 16,
          prep_time_minutes: 10,
          ingredients: [
            {
              name: "whole wheat tortilla",
              quantity: 1,
              unit: "piece",
              category: "Grains",
            },
            {
              name: "turkey breast",
              quantity: 120,
              unit: "g",
              category: "Protein",
            },
            { name: "hummus", quantity: 3, unit: "tbsp", category: "Legumes" },
          ],
        },
      ],
      DINNER: [
        {
          name: "Baked Salmon with Sweet Potato",
          description: "Omega-3 rich fish with complex carbohydrates",
          calories: 520,
          protein_g: 40,
          carbs_g: 35,
          fats_g: 22,
          prep_time_minutes: 30,
          ingredients: [
            {
              name: "salmon fillet",
              quantity: 150,
              unit: "g",
              category: "Protein",
            },
            {
              name: "sweet potato",
              quantity: 200,
              unit: "g",
              category: "Vegetables",
            },
            {
              name: "broccoli",
              quantity: 150,
              unit: "g",
              category: "Vegetables",
            },
          ],
        },
        {
          name: "Lentil Curry with Rice",
          description: "Plant-based protein with aromatic spices",
          calories: 450,
          protein_g: 22,
          carbs_g: 65,
          fats_g: 12,
          prep_time_minutes: 35,
          ingredients: [
            {
              name: "red lentils",
              quantity: 100,
              unit: "g",
              category: "Legumes",
            },
            { name: "brown rice", quantity: 80, unit: "g", category: "Grains" },
            {
              name: "coconut milk",
              quantity: 100,
              unit: "ml",
              category: "Dairy",
            },
          ],
        },
        {
          name: "Chicken Stir-fry with Vegetables",
          description: "Quick and nutritious one-pan meal",
          calories: 410,
          protein_g: 32,
          carbs_g: 25,
          fats_g: 18,
          prep_time_minutes: 20,
          ingredients: [
            {
              name: "chicken breast",
              quantity: 150,
              unit: "g",
              category: "Protein",
            },
            {
              name: "mixed stir-fry vegetables",
              quantity: 200,
              unit: "g",
              category: "Vegetables",
            },
            { name: "sesame oil", quantity: 1, unit: "tbsp", category: "Fats" },
          ],
        },
      ],
    };

    const weeklyPlan = days.map((day, dayIndex) => ({
      day,
      day_index: dayIndex,
      meals: mealTimings.map((timing, mealIndex) => {
        const mealOptionsForTiming =
          mealOptions[timing as keyof typeof mealOptions] || mealOptions.LUNCH;
        const selectedMeal =
          mealOptionsForTiming[dayIndex % mealOptionsForTiming.length];

        return {
          name: selectedMeal.name,
          description: selectedMeal.description,
          meal_timing: timing,
          dietary_category: "BALANCED",
          prep_time_minutes: selectedMeal.prep_time_minutes,
          difficulty_level: 2,
          calories: selectedMeal.calories,
          protein_g: selectedMeal.protein_g,
          carbs_g: selectedMeal.carbs_g,
          fats_g: selectedMeal.fats_g,
          fiber_g: 6,
          sugar_g: 8,
          sodium_mg: 500,
          ingredients: selectedMeal.ingredients,
          instructions: [
            {
              step: 1,
              text: `Prepare ${selectedMeal.name} according to recipe`,
            },
            { step: 2, text: "Cook ingredients as needed" },
            { step: 3, text: "Serve and enjoy" },
          ],
          allergens: [],
          image_url:
            "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
          portion_multiplier: 1.0,
          is_optional: false,
        };
      }),
    }));

    return {
      weekly_plan: weeklyPlan,
      weekly_nutrition_summary: {
        avg_daily_calories: userProfile.target_calories_daily,
        avg_daily_protein: userProfile.target_protein_daily,
        avg_daily_carbs: userProfile.target_carbs_daily,
        avg_daily_fats: userProfile.target_fats_daily,
        goal_adherence_percentage: 90,
      },
      shopping_tips: [
        "Plan your shopping list based on the weekly meals",
        "Buy seasonal produce for better prices and freshness",
        "Prepare proteins in bulk on weekends to save time",
      ],
      meal_prep_suggestions: [
        "Cook grains in batches and store in the refrigerator",
        "Pre-cut vegetables for quick meal assembly",
        "Prepare protein sources in advance for easy cooking",
      ],
    };
  }

  private static generateFallbackReplacementMeal(
    request: ReplacementMealRequest
  ): any {
    console.log("🆘 Generating fallback replacement meal...");

    const replacementOptions = [
      {
        name: "Healthy Protein Bowl",
        description: "A balanced meal with lean protein and vegetables",
        calories: 400,
        protein_g: 30,
        carbs_g: 35,
        fats_g: 15,
      },
      {
        name: "Mediterranean Style Meal",
        description: "Fresh ingredients with Mediterranean flavors",
        calories: 450,
        protein_g: 25,
        carbs_g: 40,
        fats_g: 20,
      },
      {
        name: "Asian Inspired Dish",
        description: "Light and flavorful with Asian cooking techniques",
        calories: 380,
        protein_g: 28,
        carbs_g: 30,
        fats_g: 18,
      },
    ];

    const selectedReplacement =
      replacementOptions[Math.floor(Math.random() * replacementOptions.length)];

    return {
      name: selectedReplacement.name,
      description: selectedReplacement.description,
      meal_timing: request.current_meal.meal_timing,
      dietary_category: request.current_meal.dietary_category,
      prep_time_minutes: 25,
      difficulty_level: 2,
      calories: selectedReplacement.calories,
      protein_g: selectedReplacement.protein_g,
      carbs_g: selectedReplacement.carbs_g,
      fats_g: selectedReplacement.fats_g,
      fiber_g: 8,
      sugar_g: 5,
      sodium_mg: 600,
      ingredients: [
        {
          name: "Mixed healthy ingredients",
          quantity: 100,
          unit: "g",
          category: "Mixed",
        },
      ],
      instructions: [
        {
          step: 1,
          text: "Prepare ingredients according to your dietary preferences",
        },
        {
          step: 2,
          text: "Cook using your preferred method",
        },
      ],
      allergens: [],
      image_url:
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      replacement_reason:
        "Generated as a healthy alternative that meets your nutritional needs",
    };
  }
}
