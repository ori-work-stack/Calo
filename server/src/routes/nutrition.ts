import { Router } from 'express';
import { NutritionService } from '../services/nutrition';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { mealAnalysisSchema, mealUpdateSchema } from '../types/nutrition';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Analyze meal endpoint
router.post('/analyze', async (req: AuthRequest, res) => {
  try {
    console.log('Analyze meal request received');
    console.log('Request body keys:', Object.keys(req.body));
    
    // Validate request body
    const validationResult = mealAnalysisSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data: ' + validationResult.error.errors.map(e => e.message).join(', ')
      });
    }

    const { imageBase64, language = 'english', date, updateText } = validationResult.data;
    
    if (!imageBase64 || imageBase64.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    console.log('Processing meal analysis for user:', req.user.user_id);
    console.log('Image data length:', imageBase64.length);

    const result = await NutritionService.analyzeMeal(req.user.user_id, {
      imageBase64,
      language,
      date: date || new Date().toISOString().split('T')[0],
      updateText
    });

    console.log('Analysis completed successfully');
    res.json(result);
  } catch (error) {
    console.error('Analyze meal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze meal';
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

// Update meal endpoint
router.put('/update', async (req: AuthRequest, res) => {
  try {
    console.log('Update meal request received');
    
    const validationResult = mealUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data: ' + validationResult.error.errors.map(e => e.message).join(', ')
      });
    }

    const { meal_id, updateText, language } = validationResult.data;

    console.log('Updating meal for user:', req.user.user_id);
    
    const meal = await NutritionService.updateMeal(req.user.user_id, {
      meal_id,
      updateText,
      language
    });
    
    console.log('Meal updated successfully');
    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Update meal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update meal';
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

// Save meal endpoint
router.post('/save', async (req: AuthRequest, res) => {
  try {
    console.log('Save meal request received');
    
    const { mealData, imageBase64 } = req.body;
    
    if (!mealData) {
      return res.status(400).json({
        success: false,
        error: 'Meal data is required'
      });
    }

    console.log('Saving meal for user:', req.user.user_id);
    
    const meal = await NutritionService.saveMeal(req.user.user_id, mealData, imageBase64);
    
    console.log('Meal saved successfully');
    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Save meal error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save meal';
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

// Get user meals
router.get('/meals', async (req: AuthRequest, res) => {
  try {
    console.log('Get meals request for user:', req.user.user_id);
    
    const meals = await NutritionService.getUserMeals(req.user.user_id);
    
    res.json({
      success: true,
      data: meals
    });
  } catch (error) {
    console.error('Get meals error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch meals';
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

// Get daily stats
router.get('/stats/:date', async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;
    
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Date must be in YYYY-MM-DD format'
      });
    }

    console.log('Get stats request for user:', req.user.user_id, 'date:', date);
    
    const stats = await NutritionService.getDailyStats(req.user.user_id, date);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

export { router as nutritionRoutes };