
import { Router } from 'express';
import { NutritionService } from '../services/nutrition';
import { authenticateToken } from '../middleware/auth';
import { mealAnalysisSchema } from '../types/nutrition';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Analyze meal endpoint
router.post('/analyze', async (req, res) => {
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

    const { imageBase64, language = 'english', date } = validationResult.data;
    
    if (!imageBase64 || imageBase64.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    console.log('Processing meal analysis for user:', req.user.id);
    console.log('Image data length:', imageBase64.length);

    const result = await NutritionService.analyzeMeal(req.user.id, {
      imageBase64,
      language,
      date: date || new Date().toISOString().split('T')[0]
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

// Save meal endpoint
router.post('/save', async (req, res) => {
  try {
    console.log('Save meal request received');
    
    const { mealData, imageBase64 } = req.body;
    
    if (!mealData) {
      return res.status(400).json({
        success: false,
        error: 'Meal data is required'
      });
    }

    console.log('Saving meal for user:', req.user.id);
    
    const meal = await NutritionService.saveMeal(req.user.id, mealData, imageBase64);
    
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
router.get('/meals', async (req, res) => {
  try {
    console.log('Get meals request for user:', req.user.id);
    
    const meals = await NutritionService.getUserMeals(req.user.id);
    
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
router.get('/stats/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Date must be in YYYY-MM-DD format'
      });
    }

    console.log('Get stats request for user:', req.user.id, 'date:', date);
    
    const stats = await NutritionService.getDailyStats(req.user.id, date);
    
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
