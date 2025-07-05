export interface MealPlanTemplate {
    template_id: string;
    name: string;
    description?: string | null;
    meal_timing: string;
    dietary_category: string;
    prep_time_minutes?: number | null;
    difficulty_level?: number | null;
    calories?: number | null;
    protein_g?: number | null;
    carbs_g?: number | null;
    fats_g?: number | null;
    fiber_g?: number | null;
    sugar_g?: number | null;
    sodium_mg?: number | null;
    ingredients: any[];
    instructions: any[];
    allergens: string[];
    image_url?: string | null;
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
export interface AIMealPlanResponse {
    weekly_plan: {
        day: string;
        meals: {
            name: string;
            description?: string;
            meal_timing: string;
            dietary_category: string;
            prep_time_minutes?: number;
            difficulty_level?: number;
            calories?: number;
            protein_g?: number;
            carbs_g?: number;
            fats_g?: number;
            fiber_g?: number;
            sugar_g?: number;
            sodium_mg?: number;
            ingredients: any[];
            instructions: any[];
            allergens: string[];
            image_url?: string;
            portion_multiplier?: number;
            is_optional?: boolean;
        }[];
    }[];
}
export declare class MealPlanService {
    static createUserMealPlan(user_id: string, config: UserMealPlanConfig): Promise<{
        name: string;
        user_id: string;
        meals_per_day: number;
        dietary_preferences: import("@prisma/client/runtime/library").JsonValue | null;
        plan_id: string;
        created_at: Date;
        plan_type: import(".prisma/client").$Enums.MealPlanType;
        updated_at: Date;
        snacks_per_day: number;
        rotation_frequency_days: number;
        include_leftovers: boolean;
        fixed_meal_times: boolean;
        target_calories_daily: number | null;
        target_protein_daily: number | null;
        target_carbs_daily: number | null;
        target_fats_daily: number | null;
        excluded_ingredients: import("@prisma/client/runtime/library").JsonValue | null;
        is_active: boolean;
        start_date: Date | null;
        end_date: Date | null;
    }>;
    static generateAIMealPlan(config: UserMealPlanConfig, questionnaire: any, nutritionPlan: any, user: any): Promise<AIMealPlanResponse>;
    static validateAndStructureAIResponse(aiResponse: any): AIMealPlanResponse;
    static generateFallbackMealPlan(config: UserMealPlanConfig): AIMealPlanResponse;
    static buildUserProfile(config: UserMealPlanConfig, questionnaire: any, nutritionPlan: any, user: any): {
        age: any;
        weight_kg: any;
        height_cm: any;
        target_calories_daily: any;
        target_protein_daily: any;
        target_carbs_daily: any;
        target_fats_daily: any;
        meals_per_day: number;
        snacks_per_day: number;
        rotation_frequency_days: number;
        include_leftovers: boolean;
        fixed_meal_times: boolean;
        dietary_preferences: string[];
        excluded_ingredients: string[];
        allergies: any;
        physical_activity_level: any;
        sport_frequency: any;
        main_goal: any;
        dietary_preferences_questionnaire: any;
        avoided_foods: any;
        meal_texture_preference: any;
        cooking_skill_level: string;
        available_cooking_time: string;
        kitchen_equipment: string[];
    };
    static storeAIMealTemplatesAndSchedule(plan_id: string, aiMealPlan: AIMealPlanResponse): Promise<void>;
    static getUserMealPlan(user_id: string, plan_id?: string): Promise<WeeklyMealPlan>;
    static replaceMealInPlan(user_id: string, plan_id: string, day_of_week: number, meal_timing: string, meal_order: number, preferences?: {
        dietary_category?: string;
        max_prep_time?: number;
    }): Promise<{
        success: boolean;
        new_meal: {
            name: string;
            image_url: string | null;
            calories: number | null;
            protein_g: number | null;
            carbs_g: number | null;
            fats_g: number | null;
            fiber_g: number | null;
            sugar_g: number | null;
            sodium_mg: number | null;
            allergens_json: import("@prisma/client/runtime/library").JsonValue | null;
            created_at: Date;
            updated_at: Date;
            is_active: boolean;
            template_id: string;
            description: string | null;
            meal_timing: import(".prisma/client").$Enums.MealTiming;
            dietary_category: import(".prisma/client").$Enums.DietaryCategory;
            prep_time_minutes: number | null;
            difficulty_level: number | null;
            ingredients_json: import("@prisma/client/runtime/library").JsonValue | null;
            instructions_json: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    static generateShoppingList(user_id: string, plan_id: string, week_start_date: string): Promise<{
        name: string;
        user_id: string;
        plan_id: string | null;
        created_at: Date;
        updated_at: Date;
        list_id: string;
        week_start_date: Date | null;
        items_json: import("@prisma/client/runtime/library").JsonValue;
        total_estimated_cost: number | null;
        is_completed: boolean;
    }>;
    static saveMealPreference(user_id: string, template_id: string, preference_type: string, rating?: number, notes?: string): Promise<{
        user_id: string;
        created_at: Date;
        notes: string | null;
        updated_at: Date;
        preference_id: string;
        template_id: string;
        preference_type: string;
        rating: number | null;
    }>;
    private static getCookingTimeFromMealCount;
    private static estimateIngredientCost;
    static getActiveMealPlan(user_id: string): Promise<({
        schedules: ({
            template: {
                name: string;
                image_url: string | null;
                calories: number | null;
                protein_g: number | null;
                carbs_g: number | null;
                fats_g: number | null;
                fiber_g: number | null;
                sugar_g: number | null;
                sodium_mg: number | null;
                allergens_json: import("@prisma/client/runtime/library").JsonValue | null;
                created_at: Date;
                updated_at: Date;
                is_active: boolean;
                template_id: string;
                description: string | null;
                meal_timing: import(".prisma/client").$Enums.MealTiming;
                dietary_category: import(".prisma/client").$Enums.DietaryCategory;
                prep_time_minutes: number | null;
                difficulty_level: number | null;
                ingredients_json: import("@prisma/client/runtime/library").JsonValue | null;
                instructions_json: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            plan_id: string;
            created_at: Date;
            template_id: string;
            meal_timing: import(".prisma/client").$Enums.MealTiming;
            schedule_id: string;
            day_of_week: number;
            meal_order: number;
            portion_multiplier: number;
            is_optional: boolean;
        })[];
    } & {
        name: string;
        user_id: string;
        meals_per_day: number;
        dietary_preferences: import("@prisma/client/runtime/library").JsonValue | null;
        plan_id: string;
        created_at: Date;
        plan_type: import(".prisma/client").$Enums.MealPlanType;
        updated_at: Date;
        snacks_per_day: number;
        rotation_frequency_days: number;
        include_leftovers: boolean;
        fixed_meal_times: boolean;
        target_calories_daily: number | null;
        target_protein_daily: number | null;
        target_carbs_daily: number | null;
        target_fats_daily: number | null;
        excluded_ingredients: import("@prisma/client/runtime/library").JsonValue | null;
        is_active: boolean;
        start_date: Date | null;
        end_date: Date | null;
    }) | null>;
    static deactivateMealPlan(user_id: string, plan_id: string): Promise<{
        success: boolean;
    }>;
    static duplicateMealPlan(user_id: string, plan_id: string, new_name: string): Promise<{
        name: string;
        user_id: string;
        meals_per_day: number;
        dietary_preferences: import("@prisma/client/runtime/library").JsonValue | null;
        plan_id: string;
        created_at: Date;
        plan_type: import(".prisma/client").$Enums.MealPlanType;
        updated_at: Date;
        snacks_per_day: number;
        rotation_frequency_days: number;
        include_leftovers: boolean;
        fixed_meal_times: boolean;
        target_calories_daily: number | null;
        target_protein_daily: number | null;
        target_carbs_daily: number | null;
        target_fats_daily: number | null;
        excluded_ingredients: import("@prisma/client/runtime/library").JsonValue | null;
        is_active: boolean;
        start_date: Date | null;
        end_date: Date | null;
    }>;
    static getMealPlanNutritionSummary(user_id: string, plan_id: string): Promise<{
        daily_averages: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fats_g: number;
            fiber_g: number;
            sugar_g: number;
            sodium_mg: number;
        };
        weekly_totals: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fats_g: number;
            fiber_g: number;
            sugar_g: number;
            sodium_mg: number;
        };
        daily_breakdown: Record<string, any>;
    }>;
}
//# sourceMappingURL=mealPlans.d.ts.map