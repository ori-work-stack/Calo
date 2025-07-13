import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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
  birth_date: true,
  ai_requests_count: true,
  ai_requests_reset_at: true,
  created_at: true,
  email_verified: true,
  is_questionnaire_completed: true,
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
    const { email, name, password, birth_date } = data;

    const existingUser = await prisma.user.findFirst({
      where: { email },
      select: {
        email_verified: true,
        email: true,
        name: true,
      },
    });

    if (existingUser) {
      if (existingUser.email_verified) {
        throw new Error(
          "Email already registered and verified. Please sign in instead."
        );
      } else {
        // User exists but email not verified - resend verification code
        const emailVerificationCode = crypto
          .randomInt(100000, 999999)
          .toString();

        await prisma.user.update({
          where: { email },
          data: {
            email_verification_code: emailVerificationCode,
            email_verification_expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });

        await this.sendVerificationEmail(
          email,
          emailVerificationCode,
          existingUser.name || name
        );

        return {
          user: { email, name: existingUser.name || name },
          needsEmailVerification: true,
        };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationCode = crypto.randomInt(100000, 999999).toString();

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password_hash: hashedPassword,
        subscription_type: "FREE",
        birth_date: new Date(),
        ai_requests_count: 0,
        ai_requests_reset_at: new Date(),
        email_verified: false,
        email_verification_code: emailVerificationCode,
        email_verification_expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
      select: {
        ...userSelectFields,
        email_verified: true,
        email_verification_code: true,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(email, emailVerificationCode, name);

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Created user:", user);
    }

    // Don't include sensitive data in response
    const { email_verification_code, ...userResponse } = user;
    return { user: userResponse, needsEmailVerification: true };
  }

  static async sendVerificationEmail(
    email: string,
    code: string,
    name: string
  ) {
    try {
      console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
      console.log(
        "🔑 EMAIL_PASSWORD:",
        process.env.EMAIL_PASSWORD
          ? `✅ Loaded (${process.env.EMAIL_PASSWORD.length} chars)`
          : "❌ Missing"
      );
      console.log("🔑 EMAIL_PASSWORD value:", process.env.EMAIL_PASSWORD); // Temporary debug
      const nodemailer = require("nodemailer");

      // Fixed: createTransport (not createTransporter)
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      // Test the connection
      console.log("🔍 Testing email connection...");
      await transporter.verify();
      console.log("✅ Email connection verified");

      const mailOptions = {
        from: `"NutriApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Verification - NutriApp",
        html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #007AFF; text-align: center;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for signing up! Please use the verification code below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007AFF; background: #f5f5f5; padding: 15px 20px; border-radius: 8px; display: inline-block;">${code}</span>
          </div>
          <p><strong>This code expires in 15 minutes.</strong></p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">NutriApp - Your Personal Nutrition Assistant</p>
        </div>
      `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
      console.log("📧 Message ID:", result.messageId);

      // Still log to console for development
      if (process.env.NODE_ENV !== "production") {
        console.log(`📧 Verification email for ${email}`);
        console.log(`👤 Name: ${name}`);
        console.log(`🔑 Verification Code: ${code}`);
        console.log(`⏰ Code expires in 15 minutes`);
      }

      return true;
    } catch (error: any) {
      console.error("❌ Failed to send verification email:", error);

      // More detailed error logging
      if (error.code === "EAUTH") {
        console.error(
          "🔐 Authentication failed - check your email credentials"
        );
      } else if (error.code === "ECONNECTION") {
        console.error("🌐 Connection failed - check your internet connection");
      }

      // Fallback to console logging if email fails
      console.log(`📧 FALLBACK - Verification email for ${email}`);
      console.log(`👤 Name: ${name}`);
      console.log(`🔑 Verification Code: ${code}`);
      console.log(`⏰ Code expires in 15 minutes`);

      // Don't throw error - let the signup continue even if email fails
      return true;
    }
  }

  static async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...userSelectFields,
        email_verified: true,
        email_verification_code: true,
        email_verification_expires: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.email_verified) {
      throw new Error("Email already verified");
    }

    if (
      !user.email_verification_expires ||
      user.email_verification_expires < new Date()
    ) {
      throw new Error("Verification code expired");
    }

    if (user.email_verification_code !== code) {
      throw new Error("Invalid verification code");
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        email_verified: true,
        email_verification_code: null,
        email_verification_expires: null,
      },
      select: userSelectFields,
    });

    const token = generateToken({
      user_id: updatedUser.user_id,
      email: updatedUser.email,
    });

    await prisma.session.create({
      data: {
        user_id: updatedUser.user_id,
        token,
        expiresAt: getSessionExpiryDate(),
      },
    });

    return { user: updatedUser, token };
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
