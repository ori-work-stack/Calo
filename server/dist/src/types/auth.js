"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.signInSchema = exports.signUpSchema = void 0;
const zod_1 = require("zod");
exports.signUpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    name: zod_1.z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    age: zod_1.z.coerce.number().min(1).max(120),
    weight: zod_1.z.coerce.number().positive().optional(),
    height: zod_1.z.coerce.number().positive().optional(),
});
exports.signInSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    age: zod_1.z.number().min(1).max(120).optional(),
    weight_kg: zod_1.z.number().positive().optional(),
    height_cm: zod_1.z.number().positive().optional(),
});
//# sourceMappingURL=auth.js.map