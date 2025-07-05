"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../services/auth");
const auth_2 = require("../types/auth");
const auth_3 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post("/signup", async (req, res, next) => {
    try {
        console.log("🔄 Processing signup request...");
        console.log("📱 Request body:", req.body);
        console.log("🌐 Origin:", req.headers.origin);
        console.log("📍 IP:", req.ip);
        console.log("🔍 User-Agent:", req.headers["user-agent"]);
        const validatedData = auth_2.signUpSchema.parse(req.body);
        const result = await auth_1.AuthService.signUp(validatedData);
        // Set secure HTTP-only cookie for web clients
        const isWebClient = req.headers.origin?.includes("localhost:19006") ||
            req.headers.origin?.includes("localhost:8081") ||
            req.headers["user-agent"]?.includes("Mozilla");
        if (isWebClient) {
            const cookieOptions = auth_1.AuthService.getCookieOptions();
            res.cookie("auth_token", result.token, cookieOptions);
            console.log("🍪 Cookie set for web client");
        }
        else {
            console.log("📱 Mobile client detected - token will be stored in Keychain");
        }
        console.log("✅ Signup successful");
        res.status(201).json({
            success: true,
            user: result.user,
            token: result.token, // Always send token for mobile compatibility
        });
    }
    catch (error) {
        console.error("💥 Signup error:", error);
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        else {
            next(error);
        }
    }
});
router.post("/signin", async (req, res, next) => {
    try {
        console.log("🔄 Processing signin request...");
        console.log("📱 Request body:", req.body);
        console.log("🌐 Origin:", req.headers.origin);
        console.log("📍 IP:", req.ip);
        console.log("🔍 User-Agent:", req.headers["user-agent"]);
        const validatedData = auth_2.signInSchema.parse(req.body);
        const result = await auth_1.AuthService.signIn(validatedData);
        // Set secure HTTP-only cookie for web clients
        const isWebClient = req.headers.origin?.includes("localhost:19006") ||
            req.headers.origin?.includes("localhost:8081") ||
            req.headers["user-agent"]?.includes("Mozilla");
        if (isWebClient) {
            const cookieOptions = auth_1.AuthService.getCookieOptions();
            res.cookie("auth_token", result.token, cookieOptions);
            console.log("🍪 Cookie set for web client");
        }
        else {
            console.log("📱 Mobile client detected - token will be stored in Keychain");
        }
        console.log("✅ Signin successful");
        res.json({
            success: true,
            user: result.user,
            token: result.token, // Always send token for mobile compatibility
        });
    }
    catch (error) {
        console.error("💥 Signin error:", error);
        if (error instanceof Error) {
            res.status(401).json({
                success: false,
                error: error.message,
            });
        }
        else {
            next(error);
        }
    }
});
router.get("/me", auth_3.authenticateToken, async (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});
router.post("/signout", auth_3.authenticateToken, async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token = req.cookies.auth_token || req.headers.authorization?.substring(7);
        if (token) {
            await auth_1.AuthService.signOut(token);
        }
        // Clear the cookie
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });
        console.log("✅ Signout successful, cookie cleared");
        res.json({
            success: true,
            message: "Signed out successfully",
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=auth.js.map