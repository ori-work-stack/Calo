import { z } from "zod";
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodString;
    age: z.ZodNumber;
    weight: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    age: number;
    password: string;
    weight?: number | undefined;
    height?: number | undefined;
}, {
    name: string;
    email: string;
    age: number;
    password: string;
    weight?: number | undefined;
    height?: number | undefined;
}>;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    weight_kg: z.ZodOptional<z.ZodNumber>;
    height_cm: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    height_cm?: number | undefined;
    weight_kg?: number | undefined;
    age?: number | undefined;
}, {
    name?: string | undefined;
    height_cm?: number | undefined;
    weight_kg?: number | undefined;
    age?: number | undefined;
}>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
//# sourceMappingURL=auth.d.ts.map