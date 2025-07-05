import { z } from "zod";
export declare const mealAnalysisSchema: z.ZodObject<{
    imageBase64: z.ZodString;
    language: z.ZodDefault<z.ZodEnum<["english", "hebrew"]>>;
    date: z.ZodOptional<z.ZodString>;
    updateText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    imageBase64: string;
    language: "english" | "hebrew";
    date?: string | undefined;
    updateText?: string | undefined;
}, {
    imageBase64: string;
    date?: string | undefined;
    language?: "english" | "hebrew" | undefined;
    updateText?: string | undefined;
}>;
export declare const mealUpdateSchema: z.ZodObject<{
    meal_id: z.ZodString;
    updateText: z.ZodString;
    language: z.ZodDefault<z.ZodEnum<["english", "hebrew"]>>;
}, "strip", z.ZodTypeAny, {
    meal_id: string;
    language: "english" | "hebrew";
    updateText: string;
}, {
    meal_id: string;
    updateText: string;
    language?: "english" | "hebrew" | undefined;
}>;
export declare const mealSchema: z.ZodObject<{
    meal_id: z.ZodString;
    user_id: z.ZodString;
    image_url: z.ZodString;
    meal_name: z.ZodNullable<z.ZodString>;
    calories: z.ZodNullable<z.ZodNumber>;
    protein_g: z.ZodNullable<z.ZodNumber>;
    carbs_g: z.ZodNullable<z.ZodNumber>;
    fats_g: z.ZodNullable<z.ZodNumber>;
    fiber_g: z.ZodNullable<z.ZodNumber>;
    sugar_g: z.ZodNullable<z.ZodNumber>;
    analysis_status: z.ZodEnum<["PENDING", "COMPLETED"]>;
    upload_time: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    user_id: string;
    createdAt: Date;
    meal_id: string;
    image_url: string;
    upload_time: Date;
    analysis_status: "PENDING" | "COMPLETED";
    meal_name: string | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fats_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
}, {
    user_id: string;
    createdAt: Date;
    meal_id: string;
    image_url: string;
    upload_time: Date;
    analysis_status: "PENDING" | "COMPLETED";
    meal_name: string | null;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fats_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
}>;
export type MealAnalysisInput = z.infer<typeof mealAnalysisSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
export type Meal = z.infer<typeof mealSchema>;
//# sourceMappingURL=nutrition.d.ts.map