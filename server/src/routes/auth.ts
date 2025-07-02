import { Router } from "express";
import { AuthService } from "../services/auth";
import { signUpSchema, signInSchema } from "../types/auth";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const validatedData = signUpSchema.parse(req.body);
    console.log("🔄 Processing signup request...");
    const result = await AuthService.signUp(validatedData);

    // Set secure HTTP-only cookie
    const cookieOptions = AuthService.getCookieOptions();
    res.cookie("auth_token", result.token, cookieOptions);

    console.log("✅ Signup successful, cookie set");

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token, // Still send token for mobile compatibility
    });
  } catch (error) {
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
    const validatedData = signInSchema.parse(req.body);
    console.log("🔄 Processing signin request...");
    const result = await AuthService.signIn(validatedData);

    // Set secure HTTP-only cookie
    const cookieOptions = AuthService.getCookieOptions();
    res.cookie("auth_token", result.token, cookieOptions);

    console.log("✅ Signin successful, cookie set");

    res.json({
      success: true,
      user: result.user,
      token: result.token, // Still send token for mobile compatibility
    });
  } catch (error) {
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
