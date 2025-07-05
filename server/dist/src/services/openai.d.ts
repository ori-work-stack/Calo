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
export declare class OpenAIService {
    static analyzeMealImage(imageBase64: string, language?: string, updateText?: string): Promise<MealAnalysisResult>;
    private static getMockAnalysis;
    static updateMealAnalysis(originalAnalysis: MealAnalysisResult, updateText: string, language?: string): Promise<MealAnalysisResult>;
    private static getMockUpdate;
    static generateMealPlan(userProfile: MealPlanRequest): Promise<MealPlanResponse>;
    private static parseAndValidateJSON;
    private static isValidJSONStructure;
    private static validateMealPlanStructure;
    private static generateChunkedMealPlan;
    private static generateSingleDayMeals;
    private static generateFallbackDayMeals;
    private static calculateNutritionSummary;
    static generateReplacementMeal(request: ReplacementMealRequest): Promise<any>;
    static generateNutritionInsights(meals: any[], stats: any): Promise<string[]>;
    private static generateMealTimings;
    private static generateFallbackMealPlan;
    private static generateFallbackReplacementMeal;
}
//# sourceMappingURL=openai.d.ts.map