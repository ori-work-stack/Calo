import { Router } from "express";
import { prisma } from "../lib/database";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/questionnaire - Save user questionnaire
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;
    const questionnaireData = req.body;
    console.log(userId);

    console.log("📝 Saving questionnaire for user:", userId);
    console.log("📝 Questionnaire data:", questionnaireData);

    // Check if user already has a questionnaire
    const existingQuestionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: userId },
    });

    let savedQuestionnaire;

    const sanitizeFloat = (val: any) => {
      return val === "" ? null : parseFloat(val);
    };
    questionnaireData.body_fat_percentage = sanitizeFloat(
      questionnaireData.body_fat_percentage
    );
    questionnaireData.height_cm = sanitizeFloat(questionnaireData.height_cm);
    questionnaireData.weight_kg = sanitizeFloat(questionnaireData.weight_kg);
    questionnaireData.target_weight_kg = sanitizeFloat(
      questionnaireData.target_weight_kg
    );
    questionnaireData.daily_food_budget = sanitizeFloat(
      questionnaireData.daily_food_budget
    );

    const allowedPhysicalActivityLevels = ["NONE", "LIGHT", "MODERATE", "HIGH"];

    const normalizeEnum = (value: string, allowedValues: string[]) => {
      return allowedValues.includes(value) ? value : null;
    };

    questionnaireData.physical_activity_level = normalizeEnum(
      questionnaireData.physical_activity_level,
      allowedPhysicalActivityLevels
    );

    if (existingQuestionnaire) {
      // Update existing questionnaire
      savedQuestionnaire = await prisma.userQuestionnaire.update({
        where: { questionnaire_id: existingQuestionnaire.questionnaire_id },
        data: {
          age: questionnaireData.age,
          gender: questionnaireData.gender,
          height_cm: questionnaireData.height_cm,
          weight_kg: questionnaireData.weight_kg,
          target_weight_kg: questionnaireData.target_weight_kg,
          body_fat_percentage: questionnaireData.body_fat_percentage,
          main_goal: questionnaireData.main_goal,
          main_goal_text: questionnaireData.main_goal_text,
          specific_goal: questionnaireData.specific_goal,
          goal_timeframe_days: questionnaireData.goal_timeframe_days,
          commitment_level: questionnaireData.commitment_level,
          most_important_outcome: questionnaireData.most_important_outcome,
          physical_activity_level: questionnaireData.physical_activity_level,
          sport_frequency: questionnaireData.sport_frequency,
          sport_types: questionnaireData.sport_types,
          medical_conditions: questionnaireData.medical_conditions,
          allergies: questionnaireData.allergies,
          dietary_style: questionnaireData.dietary_style,
          disliked_foods: questionnaireData.disliked_foods,
          liked_foods: questionnaireData.liked_foods,
          meals_per_day: questionnaireData.meals_per_day,
          daily_food_budget: questionnaireData.daily_food_budget,
          date_completed: new Date(),
        },
      });
    } else {
      // Create new questionnaire
      savedQuestionnaire = await prisma.userQuestionnaire.create({
        data: {
          user_id: userId,
          age: questionnaireData.age,
          gender: questionnaireData.gender,
          height_cm: questionnaireData.height_cm,
          weight_kg: questionnaireData.weight_kg,
          target_weight_kg: questionnaireData.target_weight_kg,
          body_fat_percentage: questionnaireData.body_fat_percentage,
          main_goal: questionnaireData.main_goal,
          main_goal_text: questionnaireData.main_goal_text,
          specific_goal: questionnaireData.specific_goal,
          goal_timeframe_days: questionnaireData.goal_timeframe_days,
          commitment_level: questionnaireData.commitment_level,
          most_important_outcome: questionnaireData.most_important_outcome,
          physical_activity_level: questionnaireData.physical_activity_level,
          sport_frequency: questionnaireData.sport_frequency,
          sport_types: questionnaireData.sport_types,
          medical_conditions: questionnaireData.medical_conditions,
          allergies: questionnaireData.allergies,
          dietary_style: questionnaireData.dietary_style,
          disliked_foods: questionnaireData.disliked_foods,
          liked_foods: questionnaireData.liked_foods,
          meals_per_day: questionnaireData.meals_per_day,
          daily_food_budget: questionnaireData.daily_food_budget,
          date_completed: new Date(),
        },
      });
    }

    // Mark questionnaire as completed in user profile
    await prisma.user.update({
      where: { user_id: userId },
      data: { is_questionnaire_completed: true },
    });

    console.log("✅ Questionnaire saved successfully");

    res.json({
      success: true,
      message: "Questionnaire saved successfully",
      data: savedQuestionnaire,
    });
  } catch (error) {
    console.error("💥 Questionnaire save error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save questionnaire",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/questionnaire - Retrieve user questionnaire
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.user_id;

    console.log("📖 Fetching questionnaire for user:", userId);

    const questionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: userId },
      orderBy: { date_completed: "desc" },
    });

    if (!questionnaire) {
      return res.json({
        success: true,
        message: "No questionnaire found",
        data: null,
      });
    }

    console.log("✅ Questionnaire retrieved successfully");

    res.json({
      success: true,
      message: "Questionnaire retrieved successfully",
      data: questionnaire,
    });
  } catch (error) {
    console.error("💥 Questionnaire fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch questionnaire",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as questionnaireRoutes };
