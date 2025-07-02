import { Router } from "express";
import { AuthService } from "../services/auth";
import { signUpSchema, signInSchema } from "../types/auth";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    console.log("🔄 Processing signup request...");
    console.log("📱 Request body:", req.body);
    console.log("🌐 Origin:", req.headers.origin);
    console.log("📍 IP:", req.ip);
    console.log("🔍 User-Agent:", req.headers["user-agent"]);

    const validatedData = signUpSchema.parse(req.body);
    const result = await AuthService.signUp(validatedData);

    // Set secure HTTP-only cookie for web clients
    const isWebClient =
      req.headers.origin?.includes("localhost:19006") ||
      req.headers.origin?.includes("localhost:8081") ||
      req.headers["user-agent"]?.includes("Mozilla");

    if (isWebClient) {
      const cookieOptions = AuthService.getCookieOptions();
      res.cookie("auth_token", result.token, cookieOptions);
      console.log("🍪 Cookie set for web client");
    } else {
      console.log(
        "📱 Mobile client detected - token will be stored in Keychain"
      );
    }

    console.log("✅ Signup successful");

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token, // Always send token for mobile compatibility
    });
  } catch (error) {
    console.error("💥 Signup error:", error);
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    } else {
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

    const validatedData = signInSchema.parse(req.body);
    const result = await AuthService.signIn(validatedData);

    // Set secure HTTP-only cookie for web clients
    const isWebClient =
      req.headers.origin?.includes("localhost:19006") ||
      req.headers.origin?.includes("localhost:8081") ||
      req.headers["user-agent"]?.includes("Mozilla");

    if (isWebClient) {
      const cookieOptions = AuthService.getCookieOptions();
      res.cookie("auth_token", result.token, cookieOptions);
      console.log("🍪 Cookie set for web client");
    } else {
      console.log(
        "📱 Mobile client detected - token will be stored in Keychain"
      );
    }

    console.log("✅ Signin successful");

    res.json({
      success: true,
      user: result.user,
      token: result.token, // Always send token for mobile compatibility
    });
  } catch (error) {
    console.error("💥 Signin error:", error);
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    } else {
      next(error);
    }
  }
});

router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.post(
  "/signout",
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      // Get token from cookie or header
      const token =
        req.cookies.auth_token || req.headers.authorization?.substring(7);

      if (token) {
        await AuthService.signOut(token);
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
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRoutes };
