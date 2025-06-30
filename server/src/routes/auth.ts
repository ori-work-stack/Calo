import { Router } from 'express';
import { AuthService } from '../services/auth';
import { signUpSchema, signInSchema } from '../types/auth';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const validatedData = signUpSchema.parse(req.body);
    const result = await AuthService.signUp(validatedData);
    
    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
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

router.post('/signin', async (req, res, next) => {
  try {
    const validatedData = signInSchema.parse(req.body);
    const result = await AuthService.signIn(validatedData);
    
    res.json({
      success: true,
      user: result.user,
      token: result.token,
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

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.post('/signout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await AuthService.signOut(token);
    }
    
    res.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };