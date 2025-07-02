import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth";

export interface AuthRequest extends Request {
  user?: any;
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("🔐 Authenticating request...");
    console.log("🍪 Cookies received:", req.cookies);

    // Try to get token from cookies first, then fallback to Authorization header
    let token = req.cookies.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
        console.log("📱 Using Bearer token from header");
      }
    } else {
      console.log("🍪 Using token from cookie");
    }

    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization" });
    }

    const user = await AuthService.verifyToken(token);
    console.log("✅ Token verified for user:", user.user_id);

    req.user = user;
    next();
  } catch (error) {
    console.error("💥 Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
