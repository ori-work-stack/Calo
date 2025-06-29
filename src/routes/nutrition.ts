import { Router } from 'express';
import { NutritionService } from '../services/nutrition';
import { mealAnalysisSchema } from '../types/nutrition';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/analyze', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const validatedData = mealAnalysisSchema.parse(req.body);
    const result = await NutritionService.analyzeMeal(req.user.id, validatedData);
    
    res.json({
      success: true,
      meal: result.meal,
      remainingRequests: result.remainingRequests,
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

router.get('/meals', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const date = req.query.date as string;
    const meals = await NutritionService.getUserMeals(req.user.id, date);
    
    res.json({
      success: true,
      meals,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/:date', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { date } = req.params;
    const stats = await NutritionService.getDailyStats(req.user.id, date);
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

export { router as nutritionRoutes };