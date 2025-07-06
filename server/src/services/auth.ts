import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/database";
import { SignUpInput, SignInInput } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";
const SESSION_EXPIRES_DAYS = 7;

const userSelectFields = {
  user_id: true,
  email: true,
  name: true,
  subscription_type: true,
  age: true,
  weight_kg: true,
  height_cm: true,
  ai_requests_count: true,
  ai_requests_reset_at: true,
  created_at: true,
};

function generateToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function getSessionExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_EXPIRES_DAYS);
  return date;
}

export class AuthService {
  static async signUp(data: SignUpInput) {
    const { email, name, password, age, weight, height } = data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }] },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === email
          ? "Email already registered"
          : "Username already taken"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password_hash: hashedPassword,
        subscription_type: "FREE",
        age: Number(age),
        weight_kg: weight,
        height_cm: height,
        ai_requests_count: 0,
        ai_requests_reset_at: new Date(),
      },
      select: userSelectFields,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Created user:", user);
    }

    const token = generateToken({ user_id: user.user_id, email: user.email });

    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token,
        expiresAt: getSessionExpiryDate(),
      },
    });

    return { user, token };
  }

  static async signIn(data: SignInInput) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid email or password");

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error("Invalid email or password");

    const token = generateToken({ user_id: user.user_id, email: user.email });

    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token,
        expiresAt: getSessionExpiryDate(),
      },
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        user_id: string;
        email: string;
      };

      if (
        !decoded ||
        typeof decoded !== "object" ||
        !("user_id" in decoded) ||
        !("email" in decoded)
      ) {
        throw new Error("Invalid token payload");
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: { select: userSelectFields },
        },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Session expired");
      }

      return session.user;
    } catch {
      throw new Error("Invalid token");
    }
  }

  static async signOut(token: string) {
    await prisma.session.deleteMany({ where: { token } });
  }

  static async getRolePermissions(role: string) {
    const permissions = {
      FREE: { dailyRequests: 10 },
      PREMIUM: { dailyRequests: 50 },
      GOLD: { dailyRequests: -1 },
    };

    return permissions[role as keyof typeof permissions] ?? permissions.FREE;
  }

  static getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
      path: "/",
    };
  }
}
