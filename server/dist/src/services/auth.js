"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../lib/database");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";
class AuthService {
    static async signUp(data) {
        const { email, name, password, age, weight, height } = data;
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [{ email }],
            },
        });
        if (existingUser) {
            throw new Error(existingUser.email === email
                ? "Email already registered"
                : "Username already taken");
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email,
                name,
                password_hash: hashedPassword,
                subscription_type: "FREE",
                age: Number(age),
                weight_kg: weight,
                height_cm: height,
                aiRequestsCount: 0,
                aiRequestsResetAt: new Date(),
            },
            select: {
                user_id: true,
                email: true,
                name: true,
                subscription_type: true,
                age: true,
                weight_kg: true,
                height_cm: true,
                aiRequestsCount: true,
                createdAt: true,
            },
        });
        console.log("Data being passed to Prisma:", {
            email,
            name,
            password_hash: hashedPassword,
            subscription_type: "FREE",
            age: Number(age),
            weight_kg: weight,
            height_cm: height,
            aiRequestsCount: 0,
            aiRequestsResetAt: new Date(),
        });
        console.log("Types:", {
            email: typeof email,
            name: typeof name,
            age: typeof Number(age),
            weight_kg: typeof weight,
            height_cm: typeof height,
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        // Store session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await database_1.prisma.session.create({
            data: {
                user_id: user.user_id,
                token,
                expiresAt,
            },
        });
        return { user, token };
    }
    static async signIn(data) {
        const { email, password } = data;
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error("Invalid email or password");
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        // Store session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await database_1.prisma.session.create({
            data: {
                user_id: user.user_id,
                token,
                expiresAt,
            },
        });
        const { password_hash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Check if session exists and is valid
            const session = await database_1.prisma.session.findUnique({
                where: { token },
                include: {
                    user: {
                        select: {
                            user_id: true,
                            email: true,
                            name: true,
                            subscription_type: true,
                            age: true,
                            weight_kg: true,
                            height_cm: true,
                            aiRequestsCount: true,
                            aiRequestsResetAt: true,
                            createdAt: true,
                        },
                    },
                },
            });
            if (!session || session.expiresAt < new Date()) {
                throw new Error("Session expired");
            }
            return session.user;
        }
        catch (error) {
            throw new Error("Invalid token");
        }
    }
    static async signOut(token) {
        await database_1.prisma.session.deleteMany({
            where: { token },
        });
    }
    static async getRolePermissions(role) {
        const permissions = {
            FREE: { dailyRequests: 10 },
            PREMIUM: { dailyRequests: 50 },
            GOLD: { dailyRequests: -1 }, // Unlimited
        };
        return permissions[role] || permissions.FREE;
    }
    // Helper method to create secure cookie options
    static getCookieOptions() {
        return {
            httpOnly: true, // Prevent XSS attacks
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            sameSite: "lax", // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: "/", // Available on all paths
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map