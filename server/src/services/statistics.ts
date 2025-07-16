import { prisma } from "../lib/database";
import { NutritionStatistics } from "../types/statistics";
import { OpenAIService } from "./openai";

export class StatisticsService {
  static async getNutritionStatistics(
    userId: string,
    period: "today" | "week" | "month" | "custom"
  ): Promise<NutritionStatistics> {
    try {
      console.log(
        `📊 Getting nutrition statistics for user: ${userId}, period: ${period}`
      );

      const daysBack = period === "week" ? 7 : period === "month" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get user's meal data from the Meal table using correct field names
      const meals = await prisma.meal.findMany({
        where: {
          user_id: userId,
          created_at: { gte: startDate },
        },
        orderBy: { created_at: "desc" },
      });

      console.log(`✅ Found ${meals.length} meals for statistics`);

      // Get user and nutrition plan
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      const nutritionPlan = await prisma.nutritionPlan.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      const dailyCalorieGoal = nutritionPlan?.goal_calories || 2000;

      // Calculate XP and level from meal quality
      const totalXP = this.calculateTotalXP(meals);
      const level = Math.floor(totalXP / 1000) + 1;
      const currentXP = totalXP % 1000;

      // Calculate goal achievement days
      const goalAchievementDays = this.calculateGoalAchievementDays(
        meals,
        dailyCalorieGoal
      );

      // Get previous period data for comparison
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack);
      const previousMeals = await prisma.meal.findMany({
        where: {
          user_id: userId,
          created_at: { gte: previousPeriodStart, lt: startDate },
        },
      });

      const previousStats = this.calculatePreviousStats(previousMeals);

      // Calculate statistics
      const stats = this.calculateStatistics(meals, dailyCalorieGoal);

      // Generate insights using AI
      let insights: string[] = [];
      try {
        insights = await this.generateAIInsights(meals, stats);
      } catch (error) {
        console.error("Error generating AI insights:", error);
        insights = this.getDefaultInsights(stats);
      }

      // Generate recommendations
      let recommendations: string[] = [];
      try {
        recommendations = await this.generateRecommendations(stats, user);
      } catch (error) {
        console.error("Error generating recommendations:", error);
        recommendations = this.getDefaultRecommendations();
      }

      // Get user badges and achievements
      const badgesAndAchievements = await this.getUserBadgesAndAchievements(
        userId
      );

      const result = {
        ...stats,
        insights,
        recommendations,
        totalPoints: totalXP,
        level,
        currentXP,
        ...goalAchievementDays,
        ...previousStats,
        badges: badgesAndAchievements.badges,
        achievements: badgesAndAchievements.achievements,
      };

      console.log(`📊 Statistics generated successfully for user: ${userId}`);
      return result;
    } catch (error) {
      console.error("Error in getNutritionStatistics:", error);
      // Return default empty statistics if there's an error
      return this.getEmptyStatisticsWithDefaults();
    }
  }

  private static calculateStatistics(
    meals: any[],
    dailyCalorieGoal: number
  ): Omit<NutritionStatistics, "insights" | "recommendations"> {
    if (meals.length === 0) {
      return this.getEmptyStatistics();
    }

    // Group meals by day
    const dailyData = new Map<string, any[]>();
    meals.forEach((meal) => {
      const day = meal.created_at.toISOString().split("T")[0];
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(meal);
    });

    const days = Array.from(dailyData.values());
    const totalDays = days.length;

    // Calculate daily totals using correct field names from Meal table
    const dailyTotals = days.map((dayMeals) => ({
      calories: dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      protein: dayMeals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0),
      carbs: dayMeals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0),
      fats: dayMeals.reduce((sum, meal) => sum + (meal.fats_g || 0), 0),
      fiber: dayMeals.reduce((sum, meal) => sum + (meal.fiber_g || 0), 0),
      sodium: dayMeals.reduce((sum, meal) => sum + (meal.sodium_mg || 0), 0),
      sugar: dayMeals.reduce((sum, meal) => sum + (meal.sugar_g || 0), 0),
      meal_count: dayMeals.length,
    }));

    // Calculate averages
    const average_calories_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.calories, 0) / totalDays
    );

    const average_protein_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.protein, 0) / totalDays
    );

    const average_carbs_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.carbs, 0) / totalDays
    );

    const average_fats_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.fats, 0) / totalDays
    );

    const average_fiber_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.fiber, 0) / totalDays
    );

    const average_sodium_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.sodium, 0) / totalDays
    );

    const average_sugar_daily = Math.round(
      dailyTotals.reduce((sum, day) => sum + day.sugar, 0) / totalDays
    );

    // Calculate calorie goal achievement
    const calorie_goal_achievement_percent = Math.round(
      (dailyTotals.filter(
        (day) =>
          day.calories >= dailyCalorieGoal * 0.9 &&
          day.calories <= dailyCalorieGoal * 1.1
      ).length /
        totalDays) *
        100
    );

    // Calculate processed food percentage using correct field names
    const processedFoodCount = meals.filter(
      (meal) =>
        meal.processing_level === "HIGHLY_PROCESSED" ||
        meal.processing_level === "PROCESSED" ||
        (meal.health_warnings && meal.health_warnings.includes("מעובד"))
    ).length;
    const processed_food_percentage = Math.round(
      (processedFoodCount / meals.length) * 100
    );

    // Calculate full logging percentage (3+ meals per day)
    const fullLoggingDays = dailyTotals.filter(
      (day) => day.meal_count >= 3
    ).length;
    const full_logging_percentage = Math.round(
      (fullLoggingDays / totalDays) * 100
    );

    // Calculate eating hours
    const eatingTimes = meals
      .map((meal) => meal.created_at.getHours())
      .filter((hour) => hour !== null);

    const average_eating_hours = {
      start:
        eatingTimes.length > 0 ? `${Math.min(...eatingTimes)}:00` : "08:00",
      end: eatingTimes.length > 0 ? `${Math.max(...eatingTimes)}:00` : "20:00",
    };

    // Calculate intermittent fasting
    const fastingHours =
      eatingTimes.length >= 2
        ? 24 - (Math.max(...eatingTimes) - Math.min(...eatingTimes))
        : 0;

    // Calculate alcohol and caffeine intake using correct field names
    const alcohol_caffeine_intake = Math.round(
      meals.reduce(
        (sum, meal) =>
          sum + (meal.alcohol_g || 0) + (meal.caffeine_mg || 0) / 100,
        0
      ) / totalDays
    );

    // Calculate vegetable/fruit intake (simplified)
    const vegetable_fruit_intake = Math.round(
      (meals.filter(
        (meal) =>
          meal.description?.includes("vegetable") ||
          meal.description?.includes("fruit") ||
          meal.description?.includes("ירק") ||
          meal.description?.includes("פרי")
      ).length /
        meals.length) *
        100
    );

    // Get allergen alerts using correct field name
    const allergen_alerts: string[] = [];
    meals.forEach((meal) => {
      if (meal.allergens) {
        try {
          const allergens =
            typeof meal.allergens === "string"
              ? JSON.parse(meal.allergens)
              : meal.allergens;
          if (Array.isArray(allergens)) {
            allergens.forEach((allergen) => {
              if (!allergen_alerts.includes(allergen)) {
                allergen_alerts.push(allergen);
              }
            });
          }
        } catch (e) {
          console.error("Error parsing allergens JSON:", e);
        }
      }
    });

    // Calculate health risk percentage
    const healthRiskMeals = meals.filter((meal) => meal.health_warnings).length;
    const health_risk_percentage = Math.round(
      (healthRiskMeals / meals.length) * 100
    );

    // Calculate nutrition score
    const nutrition_score = this.calculatenutrition_score({
      calorie_goal_achievement_percent,
      processed_food_percentage,
      full_logging_percentage,
      fiberIntake: average_fiber_daily,
      sodiumIntake: average_sodium_daily,
    });

    // Calculate weekly trends (last 7 days)
    const last7Days = dailyTotals.slice(-7);
    const weekly_trends = {
      calories: last7Days.map((day) => day.calories),
      protein: last7Days.map((day) => day.protein),
      carbs: last7Days.map((day) => day.carbs),
      fats: last7Days.map((day) => day.fats),
    };

    // Calculate missed meals alert
    const expectedMealsPerWeek = 21; // 3 meals * 7 days
    const actualMealsThisWeek = dailyTotals
      .slice(-7)
      .reduce((sum, day) => sum + day.meal_count, 0);
    const missed_meals_alert = Math.max(
      0,
      expectedMealsPerWeek - actualMealsThisWeek
    );

    // Calculate streak days
    const { currentStreak, bestStreak } = this.calculateStreaks(
      dailyTotals,
      dailyCalorieGoal
    );

    // Calculate mood, energy, and meal quality averages
    const moodStats = this.calculateMoodStats(meals);
    const energyStats = this.calculateEnergyStats(meals);
    const mealQualityStats = this.calculateMealQualityStats(meals);

    // Calculate daily breakdown for frontend
    const dailyBreakdown = Array.from(dailyData.entries()).map(
      ([date, dayMeals]) => ({
        date,
        calories: dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
        protein_g: dayMeals.reduce(
          (sum, meal) => sum + (meal.protein_g || 0),
          0
        ),
        carbs_g: dayMeals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0),
        fats_g: dayMeals.reduce((sum, meal) => sum + (meal.fats_g || 0), 0),
        liquids_ml: dayMeals.reduce(
          (sum, meal) => sum + (meal.liquids_ml || 0),
          0
        ),
        mood: this.getMostFrequentMood(dayMeals),
        energy: this.getMostFrequentEnergy(dayMeals),
        satiety: this.getMostFrequentSatiety(dayMeals),
        meal_quality: this.getAverageMealQuality(dayMeals),
      })
    );

    return {
      average_calories_daily,
      calorie_goal_achievement_percent,
      average_protein_daily,
      average_carbs_daily,
      average_fats_daily,
      average_fiber_daily,
      average_sodium_daily,
      average_sugar_daily,
      average_fluids_daily: 2000, // Default value, would need actual tracking
      processed_food_percentage,
      alcohol_caffeine_intake,
      vegetable_fruit_intake,
      full_logging_percentage,
      allergen_alerts,
      health_risk_percentage,
      average_eating_hours,
      intermittent_fasting_hours: fastingHours,
      missed_meals_alert,
      nutrition_score,
      weekly_trends,
      currentStreak,
      bestStreak,
      dailyBreakdown,
      moodStats,
      energyStats,
      mealQualityStats,
    };
  }

  private static calculateStreaks(
    dailyTotals: any[],
    dailyCalorieGoal: number
  ): { currentStreak: number; bestStreak: number } {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort by date descending for current streak
    const sortedDays = [...dailyTotals].reverse();

    for (const day of sortedDays) {
      const goalMet =
        day.calories >= dailyCalorieGoal * 0.8 &&
        day.calories <= dailyCalorieGoal * 1.2;

      if (goalMet) {
        tempStreak++;
        if (currentStreak === 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        tempStreak = 0;
        if (currentStreak === 0) break;
      }
    }

    if (tempStreak > bestStreak) bestStreak = tempStreak;
    if (currentStreak === 0) currentStreak = tempStreak;

    return { currentStreak, bestStreak };
  }

  private static calculateMoodStats(meals: any[]): {
    happy: number;
    neutral: number;
    sad: number;
  } {
    const moodCounts = { happy: 0, neutral: 0, sad: 0 };

    meals.forEach((meal) => {
      if (meal.mood) {
        moodCounts[meal.mood as keyof typeof moodCounts]++;
      }
    });

    return moodCounts;
  }

  private static calculateEnergyStats(meals: any[]): {
    high: number;
    medium: number;
    low: number;
  } {
    const energyCounts = { high: 0, medium: 0, low: 0 };

    meals.forEach((meal) => {
      if (meal.energy) {
        energyCounts[meal.energy as keyof typeof energyCounts]++;
      }
    });

    return energyCounts;
  }

  private static calculateMealQualityStats(meals: any[]): {
    average: number;
    distribution: number[];
  } {
    const qualityScores = meals
      .map((meal) => meal.meal_quality || 5)
      .filter((score) => score > 0);
    const average =
      qualityScores.reduce((sum, score) => sum + score, 0) /
        qualityScores.length || 5;

    const distribution = Array(10).fill(0);
    qualityScores.forEach((score) => {
      distribution[score - 1]++;
    });

    return { average, distribution };
  }

  private static getMostFrequentMood(dayMeals: any[]): string {
    const moodCounts = { happy: 0, neutral: 0, sad: 0 };
    dayMeals.forEach((meal) => {
      if (meal.mood) moodCounts[meal.mood as keyof typeof moodCounts]++;
    });

    return Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0][0];
  }

  private static getMostFrequentEnergy(dayMeals: any[]): string {
    const energyCounts = { high: 0, medium: 0, low: 0 };
    dayMeals.forEach((meal) => {
      if (meal.energy) energyCounts[meal.energy as keyof typeof energyCounts]++;
    });

    return Object.entries(energyCounts).sort(([, a], [, b]) => b - a)[0][0];
  }

  private static getMostFrequentSatiety(dayMeals: any[]): string {
    const satietyCounts = { very_full: 0, satisfied: 0, hungry: 0 };
    dayMeals.forEach((meal) => {
      if (meal.satiety)
        satietyCounts[meal.satiety as keyof typeof satietyCounts]++;
    });

    return Object.entries(satietyCounts).sort(([, a], [, b]) => b - a)[0][0];
  }

  private static getAverageMealQuality(dayMeals: any[]): number {
    const qualities = dayMeals.map((meal) => meal.meal_quality || 5);
    return (
      qualities.reduce((sum, quality) => sum + quality, 0) / qualities.length
    );
  }

  private static calculateTotalXP(meals: any[]): number {
    return meals.reduce((totalXP, meal) => {
      const quality = meal.meal_quality || 5;
      let xp = 0;

      if (quality >= 1 && quality <= 3) {
        xp = 50;
      } else if (quality >= 4 && quality <= 6) {
        xp = 75;
      } else if (quality >= 7 && quality <= 8) {
        xp = 100;
      } else if (quality >= 9 && quality <= 10) {
        xp = 150;
      }

      return totalXP + xp;
    }, 0);
  }

  private static calculateGoalAchievementDays(
    meals: any[],
    dailyCalorieGoal: number
  ): {
    proteinGoalDays: number;
    hydrationGoalDays: number;
    balancedMealDays: number;
    fiberGoalDays: number;
    perfectDays: number;
    weeklyStreak: number;
  } {
    // Group meals by day
    const dailyData = new Map<string, any[]>();
    meals.forEach((meal) => {
      const day = meal.created_at.toISOString().split("T")[0];
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(meal);
    });

    const days = Array.from(dailyData.values());

    const proteinGoalDays = days.filter((dayMeals) => {
      const totalProtein = dayMeals.reduce(
        (sum, meal) => sum + (meal.protein_g || 0),
        0
      );
      return totalProtein >= 120; // Protein goal
    }).length;

    const hydrationGoalDays = days.filter((dayMeals) => {
      const totalFluids = dayMeals.reduce(
        (sum, meal) => sum + (meal.liquids_ml || 0),
        0
      );
      return totalFluids >= 2500; // Hydration goal
    }).length;

    const balancedMealDays = days.filter((dayMeals) => {
      const totalCalories = dayMeals.reduce(
        (sum, meal) => sum + (meal.calories || 0),
        0
      );
      const totalProtein = dayMeals.reduce(
        (sum, meal) => sum + (meal.protein_g || 0),
        0
      );
      const totalCarbs = dayMeals.reduce(
        (sum, meal) => sum + (meal.carbs_g || 0),
        0
      );
      const totalFats = dayMeals.reduce(
        (sum, meal) => sum + (meal.fats_g || 0),
        0
      );

      return (
        totalCalories >= dailyCalorieGoal * 0.8 &&
        totalCalories <= dailyCalorieGoal * 1.2 &&
        totalProtein >= 120 * 0.8 &&
        totalCarbs >= 200 * 0.8 &&
        totalFats >= 60 * 0.8
      );
    }).length;

    const fiberGoalDays = days.filter((dayMeals) => {
      const totalFiber = dayMeals.reduce(
        (sum, meal) => sum + (meal.fiber_g || 0),
        0
      );
      return totalFiber >= 25; // Fiber goal
    }).length;

    const perfectDays = days.filter((dayMeals) => {
      const avgQuality =
        dayMeals.reduce((sum, meal) => sum + (meal.meal_quality || 5), 0) /
        dayMeals.length;
      return avgQuality >= 9;
    }).length;

    const weeklyStreak = Math.min(7, proteinGoalDays); // Simplified weekly streak calculation

    return {
      proteinGoalDays,
      hydrationGoalDays,
      balancedMealDays,
      fiberGoalDays,
      perfectDays,
      weeklyStreak,
    };
  }

  private static calculatePreviousStats(previousMeals: any[]): {
    previous_calories_daily?: number;
    previous_protein_daily?: number;
    previous_carbs_daily?: number;
    previous_fats_daily?: number;
    previous_fiber_daily?: number;
    previous_sodium_daily?: number;
    previous_sugar_daily?: number;
    previous_fluids_daily?: number;
  } {
    if (previousMeals.length === 0) return {};

    const dailyData = new Map<string, any[]>();
    previousMeals.forEach((meal) => {
      const day = meal.created_at.toISOString().split("T")[0];
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(meal);
    });

    const days = Array.from(dailyData.values());
    const totalDays = days.length;

    const dailyTotals = days.map((dayMeals) => ({
      calories: dayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      protein: dayMeals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0),
      carbs: dayMeals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0),
      fats: dayMeals.reduce((sum, meal) => sum + (meal.fats_g || 0), 0),
      fiber: dayMeals.reduce((sum, meal) => sum + (meal.fiber_g || 0), 0),
      sodium: dayMeals.reduce((sum, meal) => sum + (meal.sodium_mg || 0), 0),
      sugar: dayMeals.reduce((sum, meal) => sum + (meal.sugar_g || 0), 0),
      fluids: dayMeals.reduce((sum, meal) => sum + (meal.liquids_ml || 0), 0),
    }));

    return {
      previous_calories_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.calories, 0) / totalDays
      ),
      previous_protein_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.protein, 0) / totalDays
      ),
      previous_carbs_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.carbs, 0) / totalDays
      ),
      previous_fats_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.fats, 0) / totalDays
      ),
      previous_fiber_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.fiber, 0) / totalDays
      ),
      previous_sodium_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.sodium, 0) / totalDays
      ),
      previous_sugar_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.sugar, 0) / totalDays
      ),
      previous_fluids_daily: Math.round(
        dailyTotals.reduce((sum, day) => sum + day.fluids, 0) / totalDays
      ),
    };
  }

  private static calculatenutrition_score(metrics: {
    calorie_goal_achievement_percent: number;
    processed_food_percentage: number;
    full_logging_percentage: number;
    fiberIntake: number;
    sodiumIntake: number;
  }): number {
    let score = 0;

    // Calorie goal achievement (25 points)
    score += Math.min(25, metrics.calorie_goal_achievement_percent * 0.25);

    // Processed food penalty (25 points)
    score += Math.max(0, 25 - metrics.processed_food_percentage * 0.5);

    // Full logging bonus (20 points)
    score += metrics.full_logging_percentage * 0.2;

    // Fiber intake (15 points) - target 25g/day
    score += Math.min(15, (metrics.fiberIntake / 25) * 15);

    // Sodium intake penalty (15 points) - target under 2300mg
    score += Math.max(0, 15 - Math.max(0, (metrics.sodiumIntake - 2300) / 100));

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // Get user badges and achievements
  static async getUserBadgesAndAchievements(userId: string) {
    try {
      const badges = await prisma.userBadge.findMany({
        where: { user_id: userId },
        include: {
          badge: true,
        },
        orderBy: { earned_date: "desc" },
      });

      const achievements = await prisma.userAchievement.findMany({
        where: { user_id: userId },
        include: {
          achievement: true,
        },
        orderBy: { unlocked_date: "desc" },
      });

      return {
        badges: badges.map((ub) => ({
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          icon: ub.badge.icon,
          rarity: ub.badge.rarity,
          points_awarded: ub.badge.points_awarded,
          earned_date: ub.earned_date,
        })),
        achievements: achievements.map((ua) => ({
          id: ua.achievement.id,
          title: ua.achievement.title,
          description: ua.achievement.description,
          category: ua.achievement.category,
          progress: ua.progress,
          max_progress: ua.achievement.max_progress,
          unlocked: ua.unlocked,
          unlocked_date: ua.unlocked_date,
          points_awarded: ua.achievement.points_awarded,
        })),
      };
    } catch (error) {
      console.error("Error fetching badges and achievements:", error);
      return { badges: [], achievements: [] };
    }
  }

  private static getEmptyStatistics(): Omit<
    NutritionStatistics,
    "insights" | "recommendations"
  > {
    return {
      average_calories_daily: 0,
      calorie_goal_achievement_percent: 0,
      average_protein_daily: 0,
      average_carbs_daily: 0,
      average_fats_daily: 0,
      average_fiber_daily: 0,
      average_sodium_daily: 0,
      average_sugar_daily: 0,
      average_fluids_daily: 0,
      processed_food_percentage: 0,
      alcohol_caffeine_intake: 0,
      vegetable_fruit_intake: 0,
      full_logging_percentage: 0,
      allergen_alerts: [],
      health_risk_percentage: 0,
      average_eating_hours: { start: "08:00", end: "20:00" },
      intermittent_fasting_hours: 0,
      missed_meals_alert: 0,
      nutrition_score: 0,
      weekly_trends: {
        calories: [],
        protein: [],
        carbs: [],
        fats: [],
      },
    };
  }

  static async generateAIInsights(meals: any[], stats: any): Promise<string[]> {
    const insights: string[] = [];

    // Calorie insights
    if (stats.calorie_goal_achievement_percent < 50) {
      insights.push(
        "נבחן כי קשה לך לעמוד ביעד הקלורי היומי. מומלץ לתכנן ארוחות מראש"
      );
    } else if (stats.calorie_goal_achievement_percent > 80) {
      insights.push("מעולה! אתה עומד ביעד הקלורי ברוב הימים. המשך כך!");
    }

    // Processed food insights
    if (stats.processed_food_percentage > 30) {
      insights.push(
        "שיעור המזון המעובד שלך גבוה מהמומלץ. נסה להוסיף יותר מזונות טבעיים"
      );
    }

    // Timing insights
    if (stats.intermittent_fasting_hours > 16) {
      insights.push(
        `הצום היומי שלך נמשך ${stats.intermittent_fasting_hours} שעות - זה מעולה לבריאות המטבולית`
      );
    }

    // Logging insights
    if (stats.full_logging_percentage < 70) {
      insights.push("תיעוד עקבי יותר יעזור לנו לתת לך תובנות מדויקות יותר");
    }

    // Fiber insights
    if (stats.average_fiber_daily < 25) {
      insights.push("צריכת הסיבים שלך נמוכה מהמומלץ. הוסף יותר ירקות וקטניות");
    }

    // Sodium insights
    if (stats.average_sodium_daily > 2300) {
      insights.push("צריכת הנתרן שלך גבוהה. צמצם מזונות מעובדים ומלח מוסף");
    }

    try {
      // Generate AI insights using OpenAI
      const aiInsights = await OpenAIService.generateNutritionInsights(
        meals,
        stats
      );

      insights.push(...aiInsights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
    }

    return insights;
  }

  static async generateRecommendations(
    stats: any,
    user: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Personalized recommendations based on statistics
    if (stats.average_fiber_daily < 25) {
      recommendations.push(
        "הוסף יותר ירקות עלים ירוקים וקטניות לתפריט לשיפור צריכת הסיבים"
      );
    }

    if (stats.average_sodium_daily > 2300) {
      recommendations.push(
        "צמצם מזונות מעובדים ותבלינים מלוחים להפחתת צריכת הנתרן"
      );
    }

    if (stats.average_protein_daily < (user?.weight_kg || 70) * 0.8) {
      recommendations.push(
        "הגבר צריכת חלבון באמצעות עוף רזה, דגים, קטניות וביצים"
      );
    }

    if (stats.processed_food_percentage > 25) {
      recommendations.push(
        "התמקד במזונות טבעיים ובישול בבית לשיפור איכות התזונה"
      );
    }

    if (stats.vegetable_fruit_intake < 50) {
      recommendations.push("הגבר צריכת ירקות ופירות - מטרה של 5 מנות ביום");
    }

    if (stats.missed_meals_alert > 5) {
      recommendations.push(
        "שמר על קביעות בארוחות - 3 ארוחות ביום לשמירה על רמת הסוכר"
      );
    }

    return recommendations;
  }

  static async generatePDFReport(userId: string): Promise<Buffer> {
    // In a real implementation, you would use a library like puppeteer or jsPDF
    // For now, return a mock PDF buffer
    const mockPDFContent = `דו"ח תזונה אישי למשתמש ${userId}`;
    return Buffer.from(mockPDFContent, "utf8");
  }

  static async generateInsights(userId: string): Promise<{
    insights: string[];
    recommendations: string[];
  }> {
    const stats = await this.getNutritionStatistics(userId, "week");

    return {
      insights: stats.insights,
      recommendations: stats.recommendations,
    };
  }

  private static getDefaultInsights(stats: any): string[] {
    const insights: string[] = [];

    if (stats.nutrition_score > 80) {
      insights.push("אתה שומר על תזונה בריאה! המשך כך!");
    } else if (stats.nutrition_score > 60) {
      insights.push("יש לך בסיס טוב, אבל יש מקום לשיפור בתזונה");
    } else {
      insights.push("כדאי להתמקד בשיפור הרגלי התזונה");
    }

    if (stats.average_calories_daily === 0) {
      insights.push("התחל לתעד ארוחות כדי לקבל תובנות מדויקות יותר");
    }

    return insights;
  }

  private static getDefaultRecommendations(): string[] {
    return [
      "שתה יותר מים במהלך היום",
      "הוסף יותר ירקות לארוחות",
      "נסה לשמור על שעות קבועות לארוחות",
      "צמצם מזונות מעובדים",
    ];
  }

  private static getEmptyStatisticsWithDefaults(): NutritionStatistics {
    return {
      average_calories_daily: 0,
      calorie_goal_achievement_percent: 0,
      average_protein_daily: 0,
      average_carbs_daily: 0,
      average_fats_daily: 0,
      average_fiber_daily: 0,
      average_sodium_daily: 0,
      average_sugar_daily: 0,
      average_fluids_daily: 0,
      processed_food_percentage: 0,
      alcohol_caffeine_intake: 0,
      vegetable_fruit_intake: 0,
      full_logging_percentage: 0,
      allergen_alerts: [],
      health_risk_percentage: 0,
      average_eating_hours: { start: "08:00", end: "20:00" },
      intermittent_fasting_hours: 0,
      missed_meals_alert: 0,
      nutrition_score: 0,
      weekly_trends: {
        calories: [0, 0, 0, 0, 0, 0, 0],
        protein: [0, 0, 0, 0, 0, 0, 0],
        carbs: [0, 0, 0, 0, 0, 0, 0],
        fats: [0, 0, 0, 0, 0, 0, 0],
      },
      insights: ["התחל לתעד ארוחות כדי לקבל תובנות מדויקות"],
      recommendations: [
        "שתה יותר מים במהלך היום",
        "הוסף יותר ירקות לארוחות",
        "שמור על שעות קבועות לארוחות",
      ],
    };
  }
}
