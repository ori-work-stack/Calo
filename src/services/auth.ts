import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/database';
import { SignUpInput, SignInInput } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static async signUp(data: SignUpInput) {
    const { email, username, name, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        role: 'FREE', // Default role
        aiRequestsCount: 0,
        aiRequestsResetAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        aiRequestsCount: true,
        smartWatchConnected: true,
        smartWatchType: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    return { user, token };
  }

  static async signIn(data: SignInInput) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Check if session exists and is valid
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              role: true,
              aiRequestsCount: true,
              aiRequestsResetAt: true,
              smartWatchConnected: true,
              smartWatchType: true,
              meals: true,
              createdAt: true,
            }
          }
        }
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired');
      }

      return session.user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async signOut(token: string) {
    await prisma.session.deleteMany({
      where: { token }
    });
  }

  static async getRolePermissions(role: string) {
    const permissions = {
      FREE: { dailyRequests: 2 },
      PREMIUM: { dailyRequests: 50 },
      GOLD: { dailyRequests: -1 } // Unlimited
    };

    return permissions[role as keyof typeof permissions] || permissions.FREE;
  }
}