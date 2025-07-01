import { Router } from 'express';
import { prisma } from '../lib/database';
import { updateProfileSchema } from '../types/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: validatedData,
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
      }
    });
    
    res.json({
      success: true,
      user: updatedUser,
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

router.get('/subscription-info', authenticateToken, async (req: AuthRequest, res) => {
  const subscriptionInfo = {
    FREE: { dailyRequests: 2, name: 'Free Plan' },
    BASIC: { dailyRequests: 20, name: 'Basic Plan' },
    PREMIUM: { dailyRequests: 50, name: 'Premium Plan' }
  };

  const userSubscriptionType = req.user.subscription_type;
  const info = subscriptionInfo[userSubscriptionType as keyof typeof subscriptionInfo] || subscriptionInfo.FREE;

  res.json({
    success: true,
    subscription: {
      ...info,
      currentRequests: req.user.aiRequestsCount,
      resetAt: req.user.aiRequestsResetAt,
    }
  });
});

export { router as userRoutes };