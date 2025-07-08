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

    // Sanitize and validate data
    const sanitizeFloat = (val: any) => {
      return val === "" || val === null || val === undefined
        ? null
        : parseFloat(val);
    };

    const sanitizeInt = (val: any) => {
      return val === "" || val === null || val === undefined
        ? null
        : parseInt(val);
    };

    const sanitizeBoolean = (val: any) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1";
      }
      return null;
    };

    const sanitizeArray = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        }
      }
      return [];
    };

    // Sanitize numeric fields
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
    questionnaireData.goal_timeframe_days = sanitizeInt(
      questionnaireData.goal_timeframe_days
    );
    questionnaireData.sport_duration_min = sanitizeInt(
      questionnaireData.sport_duration_min
    );
    questionnaireData.meals_per_day = sanitizeInt(
      questionnaireData.meals_per_day
    );
    questionnaireData.age = sanitizeInt(questionnaireData.age);

    // Sanitize array fields
    questionnaireData.sport_types = sanitizeArray(
      questionnaireData.sport_types
    );
    questionnaireData.medical_conditions = sanitizeArray(
      questionnaireData.medical_conditions
    );
    questionnaireData.allergies = sanitizeArray(questionnaireData.allergies);
    questionnaireData.available_cooking_methods = sanitizeArray(
      questionnaireData.available_cooking_methods
    );
    questionnaireData.regular_drinks = sanitizeArray(
      questionnaireData.regular_drinks
    );

    // Sanitize boolean fields
    questionnaireData.snacks_between_meals = sanitizeBoolean(
      questionnaireData.snacks_between_meals
    );
    questionnaireData.uses_fitness_devices = sanitizeBoolean(
      questionnaireData.uses_fitness_devices
    );
    questionnaireData.kosher = sanitizeBoolean(questionnaireData.kosher);
    questionnaireData.intermittent_fasting = sanitizeBoolean(
      questionnaireData.intermittent_fasting
    );

    // Validate enums
    const allowedPhysicalActivityLevels = ["NONE", "LIGHT", "MODERATE", "HIGH"];
    const allowedMainGoals = [
      "WEIGHT_LOSS",
      "WEIGHT_MAINTENANCE",
      "WEIGHT_GAIN",
      "GENERAL_HEALTH",
      "MEDICAL_CONDITION",
      "SPORTS_PERFORMANCE",
      "ALERTNESS",
      "ENERGY",
      "SLEEP_QUALITY",
      "OTHER",
    ];
    const allowedSportFrequencies = [
      "NONE",
      "ONCE_A_WEEK",
      "TWO_TO_THREE",
      "FOUR_TO_FIVE",
      "MORE_THAN_FIVE",
    ];

    const normalizeEnum = (value: string, allowedValues: string[]) => {
      return allowedValues.includes(value) ? value : null;
    };

    questionnaireData.physical_activity_level = normalizeEnum(
      questionnaireData.physical_activity_level,
      allowedPhysicalActivityLevels
    );
    questionnaireData.main_goal = normalizeEnum(
      questionnaireData.main_goal,
      allowedMainGoals
    );
    questionnaireData.sport_frequency = normalizeEnum(
      questionnaireData.sport_frequency,
      allowedSportFrequencies
    );

    if (existingQuestionnaire) {
      // Update existing questionnaire
      savedQuestionnaire = await prisma.userQuestionnaire.update({
        where: { questionnaire_id: existingQuestionnaire.questionnaire_id },
        data: {
          // Personal data
          age: questionnaireData.age,
          gender: questionnaireData.gender,
          height_cm: questionnaireData.height_cm,
          weight_kg: questionnaireData.weight_kg,
          target_weight_kg: questionnaireData.target_weight_kg,
          body_fat_percentage: questionnaireData.body_fat_percentage,
          additional_personal_info: questionnaireData.additional_personal_info,

          // Goals
          main_goal: questionnaireData.main_goal,
          main_goal_text: questionnaireData.main_goal_text,
          specific_goal: questionnaireData.specific_goal,
          goal_timeframe_days: questionnaireData.goal_timeframe_days,
          commitment_level: questionnaireData.commitment_level,
          most_important_outcome: questionnaireData.most_important_outcome,
          special_personal_goal: questionnaireData.special_personal_goal,

          // Physical activity
          physical_activity_level: questionnaireData.physical_activity_level,
          sport_frequency: questionnaireData.sport_frequency,
          sport_types: questionnaireData.sport_types,
          sport_duration_min: questionnaireData.sport_duration_min,
          workout_times: questionnaireData.workout_times,
          uses_fitness_devices: questionnaireData.uses_fitness_devices,
          fitness_device_type: questionnaireData.fitness_device_type,
          additional_activity_info: questionnaireData.additional_activity_info,

          // Health
          medical_conditions: questionnaireData.medical_conditions,
          medical_conditions_text: questionnaireData.medical_conditions_text,
          medications: questionnaireData.medications,
          health_goals: questionnaireData.health_goals,
          functional_issues: questionnaireData.functional_issues,
          food_related_medical_issues:
            questionnaireData.food_related_medical_issues,

          // Means and conditions
          meals_per_day: questionnaireData.meals_per_day,
          snacks_between_meals: questionnaireData.snacks_between_meals,
          meal_times: questionnaireData.meal_times,
          cooking_preference: questionnaireData.cooking_preference,
          available_cooking_methods:
            questionnaireData.available_cooking_methods,
          daily_food_budget: questionnaireData.daily_food_budget,
          shopping_method: questionnaireData.shopping_method,
          daily_cooking_time: questionnaireData.daily_cooking_time,

          // Dietary preferences and restrictions
          kosher: questionnaireData.kosher,
          allergies: questionnaireData.allergies,
          allergies_text: questionnaireData.allergies_text,
          dietary_style: questionnaireData.dietary_style,
          meal_texture_preference: questionnaireData.meal_texture_preference,
          disliked_foods: questionnaireData.disliked_foods,
          liked_foods: questionnaireData.liked_foods,
          regular_drinks: questionnaireData.regular_drinks,
          intermittent_fasting: questionnaireData.intermittent_fasting,
          fasting_hours: questionnaireData.fasting_hours,

          // Additional
          past_diet_difficulties: questionnaireData.past_diet_difficulties,

          date_completed: new Date(),
        },
      });
    } else {
      // Create new questionnaire with proper user connection
      savedQuestionnaire = await prisma.userQuestionnaire.create({
        data: {
          user: {
            connect: { user_id: userId },
          },
          // Personal data
          age: questionnaireData.age,
          gender: questionnaireData.gender,
          height_cm: questionnaireData.height_cm,
          weight_kg: questionnaireData.weight_kg,
          target_weight_kg: questionnaireData.target_weight_kg,
          body_fat_percentage: questionnaireData.body_fat_percentage,
          additional_personal_info: questionnaireData.additional_personal_info,

          // Goals
          main_goal: questionnaireData.main_goal,
          main_goal_text: questionnaireData.main_goal_text,
          specific_goal: questionnaireData.specific_goal,
          goal_timeframe_days: questionnaireData.goal_timeframe_days,
          commitment_level: questionnaireData.commitment_level,
          most_important_outcome: questionnaireData.most_important_outcome,
          special_personal_goal: questionnaireData.special_personal_goal,

          // Physical activity
          physical_activity_level: "HIGH",
          sport_frequency: questionnaireData.sport_frequency,
          sport_types: questionnaireData.sport_types,
          sport_duration_min: questionnaireData.sport_duration_min,
          workout_times: questionnaireData.workout_times,
          uses_fitness_devices: questionnaireData.uses_fitness_devices,
          fitness_device_type: questionnaireData.fitness_device_type,
          additional_activity_info: questionnaireData.additional_activity_info,

          // Health
          medical_conditions: questionnaireData.medical_conditions,
          medical_conditions_text: questionnaireData.medical_conditions_text,
          medications: questionnaireData.medications,
          health_goals: questionnaireData.health_goals,
          functional_issues: questionnaireData.functional_issues,
          food_related_medical_issues:
            questionnaireData.food_related_medical_issues,

          // Means and conditions
          meals_per_day: questionnaireData.meals_per_day,
          snacks_between_meals: questionnaireData.snacks_between_meals,
          meal_times: questionnaireData.meal_times,
          cooking_preference: questionnaireData.cooking_preference,
          available_cooking_methods:
            questionnaireData.available_cooking_methods,
          daily_food_budget: questionnaireData.daily_food_budget,
          shopping_method: questionnaireData.shopping_method,
          daily_cooking_time: questionnaireData.daily_cooking_time,

          // Dietary preferences and restrictions
          kosher: questionnaireData.kosher,
          allergies: questionnaireData.allergies,
          allergies_text: questionnaireData.allergies_text,
          dietary_style: questionnaireData.dietary_style,
          meal_texture_preference: questionnaireData.meal_texture_preference,
          disliked_foods: questionnaireData.disliked_foods,
          liked_foods: questionnaireData.liked_foods,
          regular_drinks: questionnaireData.regular_drinks,
          intermittent_fasting: questionnaireData.intermittent_fasting,
          fasting_hours: questionnaireData.fasting_hours,

          // Additional
          past_diet_difficulties: questionnaireData.past_diet_difficulties,

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

    // Generate initial recommended menu (optional - can be done in background)
    try {
      const { RecommendedMenuService } = await import(
        "../services/recommendedMenu"
      );
      await RecommendedMenuService.generatePersonalizedMenu({ userId });
      console.log("✅ Initial menu generated successfully");
    } catch (error) {
      console.log("⚠️ Menu generation will be available later:", error);
    }

    res.json({
      success: true,
      message: "Questionnaire saved successfully",
      data: {
        questionnaire: savedQuestionnaire,
        is_questionnaire_completed: true,
      },
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
