import { Router } from "express";
import { prisma } from "../lib/database";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { questionnaireSchema } from "../types/questionnaire";

const router = Router();

router.post("/", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const validatedData = questionnaireSchema.parse(req.body);

    // Check if user already has a questionnaire
    const existingQuestionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: req.user.user_id },
    });

    let questionnaire;
    if (existingQuestionnaire) {
      // Update existing questionnaire
      questionnaire = await prisma.userQuestionnaire.update({
        where: { questionnaire_id: existingQuestionnaire.questionnaire_id },
        data: {
          ...validatedData,
          date_completed: new Date(),
        },
      });
    } else {
      // Create new questionnaire
      questionnaire = await prisma.userQuestionnaire.create({
        data: {
          user_id: req.user.user_id,
          ...validatedData,
        },
      });
    }

    // Create or update nutrition plan based on questionnaire
    await createNutritionPlan(req.user.user_id, validatedData);

    // Mark questionnaire as completed
    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { is_questionnaire_completed: true },
    });

    res.json({
      success: true,
      questionnaire,
      message: "Questionnaire saved successfully",
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

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const questionnaire = await prisma.userQuestionnaire.findFirst({
      where: { user_id: req.user.user_id },
      orderBy: { date_completed: "desc" },
    });

    res.json({
      success: true,
      questionnaire,
    });
  } catch (error) {
    console.error("Get questionnaire error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch questionnaire",
    });
  }
});

async function createNutritionPlan(userId: string, questionnaireData: any) {
  try {
    // Calculate BMR based on user data
    const bmr = calculateBMR(
      questionnaireData.weight_kg,
      questionnaireData.height_cm,
      questionnaireData.age,
      questionnaireData.gender
    );

    // Adjust calories based on activity level and goals
    const activityMultiplier = getActivityMultiplier(
      questionnaireData.physical_activity_level
    );
    let targetCalories = bmr * activityMultiplier;

    // Adjust for weight goals
    if (questionnaireData.main_goal === "WEIGHT_LOSS") {
      targetCalories -= 500; // 500 calorie deficit for ~1lb/week loss
    } else if (questionnaireData.main_goal === "WEIGHT_GAIN") {
      targetCalories += 500; // 500 calorie surplus for weight gain
    }

    // Calculate macronutrient targets
    const proteinCalories = targetCalories * 0.25; // 25% protein
    const carbCalories = targetCalories * 0.45; // 45% carbs
    const fatCalories = targetCalories * 0.3; // 30% fat

    const goalProteinG = proteinCalories / 4; // 4 calories per gram
    const goalCarbsG = carbCalories / 4; // 4 calories per gram
    const goalFatsG = fatCalories / 9; // 9 calories per gram

    // Create or update nutrition plan
    const existingPlan = await prisma.nutritionPlan.findFirst({
      where: { user_id: userId },
    });

    const nutritionPlanData = {
      goal_calories: targetCalories,
      goal_protein_g: goalProteinG,
      goal_carbs_g: goalCarbsG,
      goal_fats_g: goalFatsG,
      target_weight_kg: questionnaireData.target_weight_kg,
      duration_days: questionnaireData.goal_timeframe_days || 90,
      notes: `Generated from questionnaire. Main goal: ${questionnaireData.main_goal}`,
    };

    if (existingPlan) {
      await prisma.nutritionPlan.update({
        where: { plan_id: existingPlan.plan_id },
        data: nutritionPlanData,
      });
    } else {
      await prisma.nutritionPlan.create({
        data: {
          user_id: userId,
          ...nutritionPlanData,
        },
      });
    }
  } catch (error) {
    console.error("Error creating nutrition plan:", error);
  }
}

function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  // Mifflin-St Jeor Equation
  if (!weight || !height || !age) return 2000; // default fallback

  const baseCalc = 10 * weight + 6.25 * height - 5 * age;

  if (gender === "זכר" || gender === "male") {
    return baseCalc + 5;
  } else {
    return baseCalc - 161;
  }
}

function getActivityMultiplier(activityLevel: string): number {
  switch (activityLevel) {
    case "NONE":
      return 1.2;
    case "LIGHT":
      return 1.375;
    case "MODERATE":
      return 1.55;
    case "HIGH":
      return 1.725;
    default:
      return 1.2;
  }
}

export { router as questionnaireRoutes };
