"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealSchema = exports.mealUpdateSchema = exports.mealAnalysisSchema = void 0;
const zod_1 = require("zod");
exports.mealAnalysisSchema = zod_1.z.object({
    imageBase64: zod_1.z.string().min(1, "Image is required"),
    language: zod_1.z.enum(["english", "hebrew"]).default("english"),
    date: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .optional(),
    updateText: zod_1.z.string().optional(), // For meal updates
});
exports.mealUpdateSchema = zod_1.z.object({
    meal_id: zod_1.z.string().min(1, "Meal ID is required"),
    updateText: zod_1.z.string().min(1, "Update text is required"),
    language: zod_1.z.enum(["english", "hebrew"]).default("english"),
});
exports.mealSchema = zod_1.z.object({
    meal_id: zod_1.z.string(),
    user_id: zod_1.z.string(),
    image_url: zod_1.z.string(),
    meal_name: zod_1.z.string().nullable(),
    calories: zod_1.z.number().nullable(),
    protein_g: zod_1.z.number().nullable(),
    carbs_g: zod_1.z.number().nullable(),
    fats_g: zod_1.z.number().nullable(),
    fiber_g: zod_1.z.number().nullable(),
    sugar_g: zod_1.z.number().nullable(),
    analysis_status: zod_1.z.enum(["PENDING", "COMPLETED"]),
    upload_time: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
//# sourceMappingURL=nutrition.js.map