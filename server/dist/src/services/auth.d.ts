import { SignUpInput, SignInInput } from "../types/auth";
export declare class AuthService {
    static signUp(data: SignUpInput): Promise<{
        user: {
            name: string | null;
            user_id: string;
            email: string;
            subscription_type: import(".prisma/client").$Enums.SubscriptionType;
            height_cm: number | null;
            weight_kg: number | null;
            age: number;
            aiRequestsCount: number;
            createdAt: Date;
        };
        token: string;
    }>;
    static signIn(data: SignInInput): Promise<{
        user: {
            name: string | null;
            user_id: string;
            email: string;
            signup_date: Date;
            subscription_type: import(".prisma/client").$Enums.SubscriptionType;
            subscription_start: Date | null;
            subscription_end: Date | null;
            height_cm: number | null;
            weight_kg: number | null;
            age: number;
            aiRequestsCount: number;
            aiRequestsResetAt: Date;
            createdAt: Date;
        };
        token: string;
    }>;
    static verifyToken(token: string): Promise<{
        name: string | null;
        user_id: string;
        email: string;
        subscription_type: import(".prisma/client").$Enums.SubscriptionType;
        height_cm: number | null;
        weight_kg: number | null;
        age: number;
        aiRequestsCount: number;
        aiRequestsResetAt: Date;
        createdAt: Date;
    }>;
    static signOut(token: string): Promise<void>;
    static getRolePermissions(role: string): Promise<{
        dailyRequests: number;
    } | {
        dailyRequests: number;
    } | {
        dailyRequests: number;
    }>;
    static getCookieOptions(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        maxAge: number;
        path: string;
    };
}
//# sourceMappingURL=auth.d.ts.map