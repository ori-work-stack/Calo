import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChartBar as BarChart3,
  TrendingUp,
  TrendingDown,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  Clock,
  Droplets,
  Zap,
  Heart,
  Shield,
  Leaf,
  Sun,
  Globe,
  Calendar,
  Target,
  Activity,
  Flame,
  Apple,
  Wheat,
  Fish,
  Milk,
  Sparkles,
  Timer,
  Scale,
  Brain,
  Award,
  Trophy,
  Star,
  Lightbulb,
  Medal,
  Crown,
  Gem,
  Smile,
  Meh,
  Frown,
  Battery,
  Coffee,
  Moon,
  X,
  ArrowUpDown,
  ChartBar as BarChart2,
  TrendingUp as Compare,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRTLStyles } from "../../hooks/useRTLStyle";
import { nutritionAPI } from "../../src/services/api";
import { useStatistics } from "../../hooks/useQueries";
import DateTimePicker from "@react-native-community/datetimepicker";
import AccessibilityButton from "@/components/AccessibilityButton";
import LanguageToolbar from "@/components/LanguageToolbar";

const { width } = Dimensions.get("window");

type TimeRangeType = "today" | "week" | "month" | "custom";

interface StatisticsData {
  averageAlcoholG: number;
  averageCaffeineMg: number;
  averageCalories: number;
  averageCarbsG: number;
  averageCholesterolMg: number;
  averageConfidence: number;
  averageFatsG: number;
  averageFiberG: number;
  averageGlycemicIndex: number;
  averageInsolubleFiberG: number;
  averageInsulinIndex: number;
  averageLiquidsMl: number;
  averageMonounsaturatedFatsG: number;
  averageOmega3G: number;
  averageOmega6G: number;
  averagePolyunsaturatedFatsG: number;
  averageProteinG: number;
  averageSaturatedFatsG: number;
  averageServingSizeG: number;
  averageSodiumMg: number;
  averageSolubleFiberG: number;
  averageSugarG: number;
  totalAlcoholG: number;
  totalCaffeineMg: number;
  totalCalories: number;
  totalCarbsG: number;
  totalCholesterolMg: number;
  totalConfidence: number;
  totalFatsG: number;
  totalFiberG: number;
  totalGlycemicIndex: number;
  totalInsolubleFiberG: number;
  totalInsulinIndex: number;
  totalLiquidsMl: number;
  totalMonounsaturatedFatsG: number;
  totalOmega3G: number;
  totalOmega6G: number;
  totalPolyunsaturatedFatsG: number;
  totalProteinG: number;
  totalSaturatedFatsG: number;
  totalServingSizeG: number;
  totalSodiumMg: number;
  totalSolubleFiberG: number;
  totalSugarG: number;
  totalDays: number;
  totalMeals: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  dailyBreakdown: any[];
}

interface NutritionMetric {
  id: string;
  name: string;
  nameEn: string;
  value: number;
  unit: string;
  target: number;
  minTarget?: number;
  maxTarget?: number;
  percentage: number;
  status: "excellent" | "good" | "warning" | "danger";
  icon: React.ReactNode;
  color: string;
  category: "macros" | "micros" | "lifestyle" | "quality";
  description: string;
  recommendation?: string;
  trend: "up" | "down" | "stable";
  weeklyAverage: number;
  lastWeekChange: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: "streak" | "goal" | "improvement" | "consistency";
}

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  earnedDate: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface ProgressData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  weight?: number;
  mood?: "happy" | "neutral" | "sad";
  energy?: "high" | "medium" | "low";
  satiety?: "very_full" | "satisfied" | "hungry";
  mealQuality?: number;
}

interface TimeFilter {
  key: TimeRangeType;
  label: string;
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTLStyles();

  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRangeType>("week");
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<"start" | "end">(
    "start"
  );
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showAlerts, setShowAlerts] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [language, setLanguage] = useState<"he" | "en">("he");

  const texts = {
    he: {
      title: "התקדמות וסטטיסטיקות",
      subtitle: "מעקב מפורט אחר מדדי תזונה מרכזיים והתקדמות אישית",
      today: "היום",
      week: "שבוע",
      month: "חודש",
      custom: "תקופה מותאמת",
      macronutrients: "מקרו נוטריינטים",
      micronutrients: "מיקרו נוטריינטים",
      lifestyle: "אורח חיים",
      quality: "איכות תזונה",
      alerts: "התראות",
      recommendations: "המלצות",
      trend: "מגמה",
      weeklyAverage: "ממוצע שבועי",
      change: "שינוי",
      excellent: "מעולה",
      good: "טוב",
      warning: "זהירות",
      danger: "חריגה",
      viewDetails: "צפה בפרטים",
      hideAlerts: "הסתר התראות",
      showAlerts: "הצג התראות",
      noAlerts: "אין התראות כרגע",
      alertsTitle: "התראות חשובות",
      progressOverview: "סקירת התקדמות",
      weeklyProgress: "התקדמות שבועית",
      achievements: "הישגים",
      insights: "תובנות אישיות",
      gamification: "גיימיפיקציה",
      badges: "תגים",
      streaks: "רצפים",
      comparison: "השוואה",
      wellbeing: "רווחה",
      level: "רמה",
      xp: "נק׳ ניסיון",
      nextLevel: "לרמה הבאה",
      dailyStreak: "רצף יומי",
      weeklyStreak: "רצף שבועי",
      perfectDays: "ימים מושלמים",
      totalPoints: 'סה"כ נקודות',
      viewAllAchievements: "צפה בכל הישגים",
      unlocked: "נפתח",
      locked: "נעול",
      progress: "התקדמות",
      compareWith: "השווה עם",
      lastWeek: "השבוע שעבר",
      lastMonth: "החודש שעבר",
      thisWeek: "השבוע",
      thisMonth: "החודש",
      improvement: "שיפור",
      decline: "ירידה",
      stable: "יציב",
      mood: "מצב רוח",
      energy: "אנרגיה",
      satiety: "שובע",
      mealQuality: "איכות ארוחה",
      happy: "שמח",
      neutral: "ניטרלי",
      sad: "עצוב",
      high: "גבוה",
      medium: "בינוני",
      low: "נמוך",
      veryFull: "שבע מאוד",
      satisfied: "מרוצה",
      hungry: "רעב",
      averageDaily: "ממוצע יומי",
      totalConsumed: 'סה"כ נצרך',
      goalAchieved: "יעד הושג",
      streak: "רצף ימים",
      days: "ימים",
      bestDay: "היום הטוב ביותר",
      improvementArea: "אזור לשיפור",
      successfulDays: "ימים מוצלחים",
      averageCompletion: "ממוצע השלמה",
      bestStreak: "רצף הטוב ביותר",
      currentStreak: "רצף נוכחי",
      totalCalories: 'סה"כ קלוריות יומיות',
      protein: "חלבון",
      carbohydrates: "פחמימות",
      fats: "שומנים",
      fiber: "סיבים תזונתיים",
      sugars: "סוכרים",
      sodium: "נתרן",
      saturatedFat: "שומן רווי",
      unsaturatedFat: "שומן בלתי רווי",
      omega3: "אומגה 3",
      vitaminD: "ויטמין D",
      vitaminB12: "ויטמין B12",
      calcium: "סידן",
      iron: "ברזל",
      magnesium: "מגנזיום",
      potassium: "אשלגן",
      glycemicLoad: "עומס גליקמי",
      plantBased: "תזונה צמחית",
      hydration: "רמת הידרציה",
      mealTiming: "תזמון ארוחות",
      satietyIndex: "מדד שובע",
      antioxidants: "נוגדי חמצון",
      kcal: 'קק"ל',
      g: "גר׳",
      mg: 'מ"ג',
      mcg: 'מק"ג',
      iu: 'יח"ב',
      ml: 'מ"ל',
      percent: "%",
      score: "ניקוד",
      meals: "ארוחות",
      hours: "שעות",
      insightTitle: "תובנות חכמות מבוססות נתונים",
      proteinInsight:
        "אתה עומד ביעד החלבון ב-85% מהימים השבוע - מעולה לבניית שרירים!",
      hydrationInsight: "צריכת המים שלך השתפרה ב-23% השבוע - המשך כך!",
      fiberInsight:
        "הסיבים התזונתיים נמוכים מהמומלץ - הוסף יותר ירקות וקטניות.",
      achievementStreak7: "רצף של 7 ימים",
      achievementStreak30: "רצף של 30 ימים",
      achievementProteinMaster: "מאסטר חלבון",
      achievementHydrationHero: "גיבור הידרציה",
      achievementBalancedEater: "אוכל מאוזן",
      achievementFiberFriend: "חבר הסיבים",
      badgeNutritionNinja: "נינג׳ה תזונה",
      badgeWaterWarrior: "לוחם המים",
      badgeProteinPro: "מקצוען חלבון",
      badgeStreakStar: "כוכב הרצף",
      badgeBalanceMaster: "מאסטר איזון",
      badgeConsistencyKing: "מלך העקביות",
      calories: "קלוריות",
      water: "מים",
      increaseIntake: "הגדל צריכה",
      decreaseIntake: "הפחת צריכה",
      maintainLevel: "שמור על הרמה",
      consultDoctor: "התייעץ עם רופא",
      addSupplement: "שקול תוסף תזונה",
      improveHydration: "שפר הידרציה",
      balanceMeals: "איזן זמני ארוחות",
      increaseFiber: "הוסף סיבים תזונתיים",
      reduceSodium: "הפחת נתרן",
      addOmega3: "הוסף מקורות אומגה 3",
    },
    en: {
      title: "Progress & Statistics",
      subtitle:
        "Detailed tracking of key nutritional metrics and personal progress",
      today: "Today",
      week: "Week",
      month: "Month",
      custom: "Custom Period",
      macronutrients: "Macronutrients",
      micronutrients: "Micronutrients",
      lifestyle: "Lifestyle",
      quality: "Nutrition Quality",
      alerts: "Alerts",
      recommendations: "Recommendations",
      trend: "Trend",
      weeklyAverage: "Weekly Average",
      change: "Change",
      excellent: "Excellent",
      good: "Good",
      warning: "Warning",
      danger: "Out of Range",
      viewDetails: "View Details",
      hideAlerts: "Hide Alerts",
      showAlerts: "Show Alerts",
      noAlerts: "No alerts at the moment",
      alertsTitle: "Important Alerts",
      progressOverview: "Progress Overview",
      weeklyProgress: "Weekly Progress",
      achievements: "Achievements",
      insights: "Personal Insights",
      gamification: "Gamification",
      badges: "Badges",
      streaks: "Streaks",
      comparison: "Comparison",
      wellbeing: "Wellbeing",
      level: "Level",
      xp: "XP",
      nextLevel: "To Next Level",
      dailyStreak: "Daily Streak",
      weeklyStreak: "Weekly Streak",
      perfectDays: "Perfect Days",
      totalPoints: "Total Points",
      viewAllAchievements: "View All Achievements",
      unlocked: "Unlocked",
      locked: "Locked",
      progress: "Progress",
      compareWith: "Compare With",
      lastWeek: "Last Week",
      lastMonth: "Last Month",
      thisWeek: "This Week",
      thisMonth: "This Month",
      improvement: "Improvement",
      decline: "Decline",
      stable: "Stable",
      mood: "Mood",
      energy: "Energy",
      satiety: "Satiety",
      mealQuality: "Meal Quality",
      happy: "Happy",
      neutral: "Neutral",
      sad: "Sad",
      high: "High",
      medium: "Medium",
      low: "Low",
      veryFull: "Very Full",
      satisfied: "Satisfied",
      hungry: "Hungry",
      averageDaily: "Daily Average",
      totalConsumed: "Total Consumed",
      goalAchieved: "Goal Achieved",
      streak: "Day Streak",
      days: "days",
      bestDay: "Best Day",
      improvementArea: "Improvement Area",
      successfulDays: "Successful Days",
      averageCompletion: "Average Completion",
      bestStreak: "Best Streak",
      currentStreak: "Current Streak",
      totalCalories: "Total Daily Calories",
      protein: "Protein",
      carbohydrates: "Carbohydrates",
      fats: "Fats",
      fiber: "Dietary Fiber",
      sugars: "Sugars",
      sodium: "Sodium",
      saturatedFat: "Saturated Fat",
      unsaturatedFat: "Unsaturated Fat",
      omega3: "Omega-3",
      vitaminD: "Vitamin D",
      vitaminB12: "Vitamin B12",
      calcium: "Calcium",
      iron: "Iron",
      magnesium: "Magnesium",
      potassium: "Potassium",
      glycemicLoad: "Glycemic Load",
      plantBased: "Plant-Based Nutrition",
      hydration: "Hydration Level",
      mealTiming: "Meal Timing",
      satietyIndex: "Satiety Index",
      antioxidants: "Antioxidants",
      kcal: "kcal",
      g: "g",
      mg: "mg",
      mcg: "mcg",
      iu: "IU",
      ml: "ml",
      percent: "%",
      score: "score",
      meals: "meals",
      hours: "hours",
      insightTitle: "Smart Data-Driven Insights",
      proteinInsight:
        "You're meeting protein goals 85% of days this week - excellent for muscle building!",
      hydrationInsight:
        "Your water intake improved by 23% this week - keep it up!",
      fiberInsight:
        "Dietary fiber is below recommended - add more vegetables and legumes.",
      achievementStreak7: "7-Day Streak",
      achievementStreak30: "30-Day Streak",
      achievementProteinMaster: "Protein Master",
      achievementHydrationHero: "Hydration Hero",
      achievementBalancedEater: "Balanced Eater",
      achievementFiberFriend: "Fiber Friend",
      badgeNutritionNinja: "Nutrition Ninja",
      badgeWaterWarrior: "Water Warrior",
      badgeProteinPro: "Protein Pro",
      badgeStreakStar: "Streak Star",
      badgeBalanceMaster: "Balance Master",
      badgeConsistencyKing: "Consistency King",
      calories: "calories",
      water: "water",
      increaseIntake: "Increase intake",
      decreaseIntake: "Decrease intake",
      maintainLevel: "Maintain level",
      consultDoctor: "Consult doctor",
      addSupplement: "Consider supplement",
      improveHydration: "Improve hydration",
      balanceMeals: "Balance meal timing",
      increaseFiber: "Add fiber sources",
      reduceSodium: "Reduce sodium",
      addOmega3: "Add omega-3 sources",
    },
  };

  const currentTexts = texts[language];
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "he" ? "en" : "he"));
  };

  // Generate date range based on selection
  const getDateRange = useCallback(() => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    switch (selectedTimeRange) {
      case "today":
        return {
          start: formatDate(today),
          end: formatDate(today),
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: formatDate(weekStart),
          end: formatDate(today),
        };
      case "month":
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          start: formatDate(monthStart),
          end: formatDate(today),
        };
      case "custom":
        return {
          start: formatDate(customStartDate),
          end: formatDate(customEndDate),
        };
      default:
        return {
          start: formatDate(
            new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          ),
          end: formatDate(today),
        };
    }
  }, [selectedTimeRange, customStartDate, customEndDate]);

  // Use react-query for statistics data
  const { start, end } = getDateRange();
  const {
    data: statisticsResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useStatistics(
    selectedTimeRange,
    selectedTimeRange === "custom" ? start : undefined,
    selectedTimeRange === "custom" ? end : undefined
  );

  // Transform the response data
  const statisticsData = useMemo(() => {
    if (!statisticsResponse?.success || !statisticsResponse?.data) return null;

    const d = statisticsResponse.data;
    return {
      averageAlcoholG: d.average_alcohol_g || 0,
      averageCaffeineMg: d.average_caffeine_mg || 0,
      averageCalories: d.average_calories || 0,
      averageCarbsG: d.average_carbs_g || 0,
      averageCholesterolMg: d.average_cholesterol_mg || 0,
      averageConfidence: d.average_confidence || 0,
      averageFatsG: d.average_fats_g || 0,
      averageFiberG: d.average_fiber_g || 0,
      averageGlycemicIndex: d.average_glycemic_index || 0,
      averageInsolubleFiberG: d.average_insoluble_fiber_g || 0,
      averageInsulinIndex: d.average_insulin_index || 0,
      averageLiquidsMl: d.average_liquids_ml || 0,
      averageMonounsaturatedFatsG: d.average_monounsaturated_fats_g || 0,
      averageOmega3G: d.average_omega_3_g || 0,
      averageOmega6G: d.average_omega_6_g || 0,
      averagePolyunsaturatedFatsG: d.average_polyunsaturated_fats_g || 0,
      averageProteinG: d.average_protein_g || 0,
      averageSaturatedFatsG: d.average_saturated_fats_g || 0,
      averageServingSizeG: d.average_serving_size_g || 0,
      averageSodiumMg: d.average_sodium_mg || 0,
      averageSolubleFiberG: d.average_soluble_fiber_g || 0,
      averageSugarG: d.average_sugar_g || 0,
      totalAlcoholG: d.total_alcohol_g || 0,
      totalCaffeineMg: d.total_caffeine_mg || 0,
      totalCalories: d.total_calories || 0,
      totalCarbsG: d.total_carbs_g || 0,
      totalCholesterolMg: d.total_cholesterol_mg || 0,
      totalConfidence: d.total_confidence || 0,
      totalFatsG: d.total_fats_g || 0,
      totalFiberG: d.total_fiber_g || 0,
      totalGlycemicIndex: d.total_glycemic_index || 0,
      totalInsolubleFiberG: d.total_insoluble_fiber_g || 0,
      totalInsulinIndex: d.total_insulin_index || 0,
      totalLiquidsMl: d.total_liquids_ml || 0,
      totalMonounsaturatedFatsG: d.total_monounsaturated_fats_g || 0,
      totalOmega3G: d.total_omega_3_g || 0,
      totalOmega6G: d.total_omega_6_g || 0,
      totalPolyunsaturatedFatsG: d.total_polyunsaturated_fats_g || 0,
      totalProteinG: d.total_protein_g || 0,
      totalSaturatedFatsG: d.total_saturated_fats_g || 0,
      totalServingSizeG: d.total_serving_size_g || 0,
      totalSodiumMg: d.total_sodium_mg || 0,
      totalSolubleFiberG: d.total_soluble_fiber_g || 0,
      totalSugarG: d.total_sugar_g || 0,
      totalDays: d.total_days || 0,
      totalMeals: d.total_meals || 0,
      dateRange: {
        startDate: start,
        endDate: end,
      },
      dailyBreakdown: d.dailyBreakdown || [],
    };
  }, [statisticsResponse, start, end]);

  const error = queryError?.message || null;

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Generate nutrition metrics from statistics data
  const generateNutritionMetrics = useCallback((): NutritionMetric[] => {
    if (!statisticsData) return [];

    const baseData = [
      {
        id: "calories",
        name: currentTexts.totalCalories,
        nameEn: "Total Calories",
        value: statisticsData.averageCalories,
        target: 2000,
        unit: currentTexts.kcal,
        icon: <Flame size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "macros" as const,
        description: "צריכת קלוריות יומית כוללת",
        trend: "up" as const,
        weeklyAverage: statisticsData.averageCalories,
        lastWeekChange: 2.4,
      },
      {
        id: "protein",
        name: currentTexts.protein,
        nameEn: "Protein",
        value: statisticsData.averageProteinG,
        target: 120,
        unit: currentTexts.g,
        icon: <Zap size={20} color="#9B59B6" />,
        color: "#9B59B6",
        category: "macros" as const,
        description: "חלבון לבניית שרירים ותיקון רקמות",
        trend: "down" as const,
        weeklyAverage: statisticsData.averageProteinG,
        lastWeekChange: -6.3,
      },
      {
        id: "carbs",
        name: currentTexts.carbohydrates,
        nameEn: "Carbohydrates",
        value: statisticsData.averageCarbsG,
        target: 225,
        unit: currentTexts.g,
        icon: <Wheat size={20} color="#F39C12" />,
        color: "#F39C12",
        category: "macros" as const,
        description: "פחמימות לאנרגיה ותפקוד המוח",
        trend: "stable" as const,
        weeklyAverage: statisticsData.averageCarbsG,
        lastWeekChange: -2.4,
      },
      {
        id: "fats",
        name: currentTexts.fats,
        nameEn: "Fats",
        value: statisticsData.averageFatsG,
        target: 70,
        unit: currentTexts.g,
        icon: <Fish size={20} color="#16A085" />,
        color: "#16A085",
        category: "macros" as const,
        description: "שומנים בריאים לתפקוד הורמונלי",
        trend: "up" as const,
        weeklyAverage: statisticsData.averageFatsG,
        lastWeekChange: 4.7,
      },
      {
        id: "fiber",
        name: currentTexts.fiber,
        nameEn: "Fiber",
        value: statisticsData.averageFiberG,
        target: 25,
        unit: currentTexts.g,
        icon: <Leaf size={20} color="#27AE60" />,
        color: "#27AE60",
        category: "micros" as const,
        description: "סיבים תזונתיים לבריאות העיכול",
        recommendation: currentTexts.increaseFiber,
        trend: "down" as const,
        weeklyAverage: statisticsData.averageFiberG,
        lastWeekChange: -14.3,
      },
      {
        id: "sugars",
        name: currentTexts.sugars,
        nameEn: "Sugars",
        value: statisticsData.averageSugarG,
        target: 50,
        maxTarget: 50,
        unit: currentTexts.g,
        icon: <Apple size={20} color="#E67E22" />,
        color: "#E67E22",
        category: "micros" as const,
        description: "סוכרים פשוטים - מומלץ להגביל",
        recommendation: currentTexts.decreaseIntake,
        trend: "up" as const,
        weeklyAverage: statisticsData.averageSugarG,
        lastWeekChange: 8.3,
      },
      {
        id: "sodium",
        name: currentTexts.sodium,
        nameEn: "Sodium",
        value: statisticsData.averageSodiumMg,
        target: 2300,
        maxTarget: 2300,
        unit: currentTexts.mg,
        icon: <Shield size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "micros" as const,
        description: "נתרן - חשוב להגביל למניעת יתר לחץ דם",
        recommendation: currentTexts.reduceSodium,
        trend: "up" as const,
        weeklyAverage: statisticsData.averageSodiumMg,
        lastWeekChange: 9.1,
      },
      {
        id: "hydration",
        name: currentTexts.hydration,
        nameEn: "Hydration",
        value: statisticsData.averageLiquidsMl,
        target: 2500,
        unit: currentTexts.ml,
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description: "רמת הידרציה יומית",
        recommendation: currentTexts.improveHydration,
        trend: "down" as const,
        weeklyAverage: statisticsData.averageLiquidsMl,
        lastWeekChange: -11.9,
      },
    ];

    return baseData.map((metric) => {
      const percentage = metric.maxTarget
        ? Math.min((metric.target / metric.value) * 100, 100)
        : Math.min((metric.value / metric.target) * 100, 100);

      let status: "excellent" | "good" | "warning" | "danger";

      if (metric.maxTarget) {
        if (metric.value <= metric.target * 0.8) status = "excellent";
        else if (metric.value <= metric.target) status = "good";
        else if (metric.value <= metric.target * 1.2) status = "warning";
        else status = "danger";
      } else {
        if (percentage >= 100) status = "excellent";
        else if (percentage >= 80) status = "good";
        else if (percentage >= 60) status = "warning";
        else status = "danger";
      }

      return {
        ...metric,
        percentage: Math.round(percentage),
        status,
      };
    });
  }, [statisticsData, currentTexts]);

  // Generate weekly progress data
  const generateWeeklyData = useCallback((): ProgressData[] => {
    if (!statisticsData || !statisticsData.dailyBreakdown) return [];

    const weeklyData: ProgressData[] = [];
    const moods: ("happy" | "neutral" | "sad")[] = ["happy", "neutral", "sad"];
    const energyLevels: ("high" | "medium" | "low")[] = [
      "high",
      "medium",
      "low",
    ];
    const satietyLevels: ("very_full" | "satisfied" | "hungry")[] = [
      "very_full",
      "satisfied",
      "hungry",
    ];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      weeklyData.push({
        date: date.toISOString().split("T")[0],
        calories: Math.floor(Math.random() * 400) + 1600,
        protein: Math.floor(Math.random() * 40) + 80,
        carbs: Math.floor(Math.random() * 50) + 180,
        fats: Math.floor(Math.random() * 20) + 60,
        water: Math.floor(Math.random() * 800) + 1800,
        weight: i === 0 ? 68.5 : undefined,
        mood: moods[Math.floor(Math.random() * moods.length)],
        energy: energyLevels[Math.floor(Math.random() * energyLevels.length)],
        satiety:
          satietyLevels[Math.floor(Math.random() * satietyLevels.length)],
        mealQuality: Math.floor(Math.random() * 3) + 3,
      });
    }
    return weeklyData;
  }, [statisticsData]);

  // Generate achievements
  const generateAchievements = useCallback((): Achievement[] => {
    return [
      {
        id: "streak_7",
        title: currentTexts.achievementStreak7,
        description: "עמד ביעדים 7 ימים רצופים",
        icon: <Flame size={24} color="#E74C3C" />,
        color: "#E74C3C",
        progress: 7,
        maxProgress: 7,
        unlocked: true,
        category: "streak",
      },
      {
        id: "streak_30",
        title: currentTexts.achievementStreak30,
        description: "עמד ביעדים 30 ימים רצופים",
        icon: <Crown size={24} color="#F39C12" />,
        color: "#F39C12",
        progress: 12,
        maxProgress: 30,
        unlocked: false,
        category: "streak",
      },
      {
        id: "protein_master",
        title: currentTexts.achievementProteinMaster,
        description: "עמד ביעד החלבון 20 ימים",
        icon: <Zap size={24} color="#9B59B6" />,
        color: "#9B59B6",
        progress: 20,
        maxProgress: 20,
        unlocked: true,
        category: "goal",
      },
      {
        id: "hydration_hero",
        title: currentTexts.achievementHydrationHero,
        description: "שתה 2.5 ליטר מים 14 ימים רצופים",
        icon: <Droplets size={24} color="#3498DB" />,
        color: "#3498DB",
        progress: 8,
        maxProgress: 14,
        unlocked: false,
        category: "goal",
      },
      {
        id: "balanced_eater",
        title: currentTexts.achievementBalancedEater,
        description: "איזן מקרו נוטריינטים 10 ימים",
        icon: <Scale size={24} color="#16A085" />,
        color: "#16A085",
        progress: 10,
        maxProgress: 10,
        unlocked: true,
        category: "improvement",
      },
      {
        id: "fiber_friend",
        title: currentTexts.achievementFiberFriend,
        description: "צרך 25 גרם סיבים 7 ימים",
        icon: <Leaf size={24} color="#27AE60" />,
        color: "#27AE60",
        progress: 4,
        maxProgress: 7,
        unlocked: false,
        category: "improvement",
      },
    ];
  }, [currentTexts]);

  // Generate badges
  const generateBadges = useCallback((): Badge[] => {
    return [
      {
        id: "nutrition_ninja",
        name: currentTexts.badgeNutritionNinja,
        icon: <Star size={20} color="#F39C12" />,
        color: "#F39C12",
        earnedDate: "2024-01-15",
        rarity: "epic",
      },
      {
        id: "water_warrior",
        name: currentTexts.badgeWaterWarrior,
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        earnedDate: "2024-01-10",
        rarity: "rare",
      },
      {
        id: "protein_pro",
        name: currentTexts.badgeProteinPro,
        icon: <Zap size={20} color="#9B59B6" />,
        color: "#9B59B6",
        earnedDate: "2024-01-08",
        rarity: "common",
      },
      {
        id: "streak_star",
        name: currentTexts.badgeStreakStar,
        icon: <Flame size={20} color="#E74C3C" />,
        color: "#E74C3C",
        earnedDate: "2024-01-12",
        rarity: "legendary",
      },
    ];
  }, [currentTexts]);

  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const helpContent = {
    title: "סטטיסטיקות תזונה",
    description:
      "כאן תוכל לראות את הנתונים התזונתיים שלך לאורך זמן. בחר תקופה שונה כדי לראות נתונים מפורטים על הצריכה הקלורית, חלבונים, פחמימות ושומנים. הנתונים מבוססים על הארוחות שצילמת והעלית למערכת.",
  };
  // Update dependent data when statistics change
  useEffect(() => {
    if (statisticsData) {
      setMetrics(generateNutritionMetrics());
      setWeeklyData(generateWeeklyData());
      setAchievements(generateAchievements());
      setBadges(generateBadges());
    }
  }, [
    statisticsData,
    generateNutritionMetrics,
    generateWeeklyData,
    generateAchievements,
    generateBadges,
  ]);

  // Date picker handlers
  const openDatePicker = (type: "start" | "end") => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerType === "start") {
        setCustomStartDate(selectedDate);
      } else {
        setCustomEndDate(selectedDate);
      }
    }
  };

  const timeFilters: TimeFilter[] = [
    { key: "today", label: currentTexts.today },
    { key: "week", label: currentTexts.week },
    { key: "month", label: currentTexts.month },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "#2ECC71";
      case "good":
        return "#F39C12";
      case "warning":
        return "#E67E22";
      case "danger":
        return "#E74C3C";
      default:
        return "#95A5A6";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle size={16} color="#2ECC71" />;
      case "good":
        return <CheckCircle size={16} color="#F39C12" />;
      case "warning":
        return <AlertTriangle size={16} color="#E67E22" />;
      case "danger":
        return <AlertTriangle size={16} color="#E74C3C" />;
      default:
        return <CheckCircle size={16} color="#95A5A6" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={14} color="#2ECC71" />;
      case "down":
        return <TrendingDown size={14} color="#E74C3C" />;
      default:
        return <Target size={14} color="#95A5A6" />;
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "happy":
        return <Smile size={16} color="#2ECC71" />;
      case "neutral":
        return <Meh size={16} color="#F39C12" />;
      case "sad":
        return <Frown size={16} color="#E74C3C" />;
      default:
        return <Meh size={16} color="#95A5A6" />;
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case "high":
        return <Battery size={16} color="#2ECC71" />;
      case "medium":
        return <Battery size={16} color="#F39C12" />;
      case "low":
        return <Battery size={16} color="#E74C3C" />;
      default:
        return <Battery size={16} color="#95A5A6" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "#95A5A6";
      case "rare":
        return "#3498DB";
      case "epic":
        return "#9B59B6";
      case "legendary":
        return "#F39C12";
      default:
        return "#95A5A6";
    }
  };

  const getAlertsData = () => {
    return metrics
      .filter(
        (metric) => metric.status === "danger" || metric.status === "warning"
      )
      .map((metric) => ({
        id: metric.id,
        title: metric.name,
        message:
          metric.recommendation ||
          (metric.status === "danger"
            ? currentTexts.consultDoctor
            : currentTexts.maintainLevel),
        severity: metric.status,
        icon: metric.icon,
      }));
  };

  // Calculate progress statistics
  const calculateProgressStats = () => {
    if (!statisticsData)
      return {
        totalDays: 0,
        successfulDays: 0,
        averageCompletion: 0,
        bestStreak: 0,
        currentStreak: 0,
        averages: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          water: 0,
        },
      };

    const goals = {
      calories: 1800,
      protein: 120,
      carbs: 225,
      fats: 70,
      water: 2500,
    };
    const averages = {
      calories: Math.round(statisticsData.averageCalories),
      protein: Math.round(statisticsData.averageProteinG),
      carbs: Math.round(statisticsData.averageCarbsG),
      fats: Math.round(statisticsData.averageFatsG),
      water: Math.round(statisticsData.averageLiquidsMl),
    };

    const successfulDays = Math.floor(statisticsData.totalDays * 0.7); // Mock calculation
    const averageCompletion = Math.round(
      ((averages.calories / goals.calories +
        averages.protein / goals.protein +
        averages.water / goals.water) /
        3) *
        100
    );

    return {
      totalDays: statisticsData.totalDays,
      successfulDays,
      averageCompletion,
      bestStreak: 4,
      currentStreak: 2,
      averages,
    };
  };

  // Calculate gamification stats
  const calculateGamificationStats = () => {
    const level = 12;
    const currentXP = 2340;
    const nextLevelXP = 2500;
    const totalPoints = 15680;
    const dailyStreak = 7;
    const weeklyStreak = 3;
    const perfectDays = 23;

    return {
      level,
      currentXP,
      nextLevelXP,
      totalPoints,
      dailyStreak,
      weeklyStreak,
      perfectDays,
      xpToNext: nextLevelXP - currentXP,
      xpProgress: (currentXP / nextLevelXP) * 100,
    };
  };

  // Calculate wellbeing insights
  const calculateWellbeingInsights = () => {
    const moodData = weeklyData.map((d) => d.mood);
    const energyData = weeklyData.map((d) => d.energy);
    const satietyData = weeklyData.map((d) => d.satiety);

    const happyDays = moodData.filter((m) => m === "happy").length;
    const highEnergyDays = energyData.filter((e) => e === "high").length;
    const satisfiedDays = satietyData.filter(
      (s) => s === "satisfied" || s === "very_full"
    ).length;

    const averageMealQuality =
      weeklyData.reduce((sum, day) => sum + (day.mealQuality || 3), 0) /
      weeklyData.length;

    return {
      happyDays,
      highEnergyDays,
      satisfiedDays,
      averageMealQuality: averageMealQuality.toFixed(1),
      totalDays: weeklyData.length,
    };
  };

  const categorizedMetrics = {
    macros: metrics.filter((m) => m.category === "macros"),
    micros: metrics.filter((m) => m.category === "micros"),
    lifestyle: metrics.filter((m) => m.category === "lifestyle"),
    quality: metrics.filter((m) => m.category === "quality"),
  };

  const progressStats = calculateProgressStats();
  const gamificationStats = calculateGamificationStats();
  const wellbeingInsights = calculateWellbeingInsights();

  const renderMetricCard = (metric: NutritionMetric) => (
    <TouchableOpacity
      key={metric.id}
      style={styles.metricCard}
      onPress={() => Alert.alert(metric.name, metric.description)}
    >
      <LinearGradient
        colors={[`${metric.color}15`, `${metric.color}05`]}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <View style={styles.metricIconContainer}>{metric.icon}</View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricName}>{metric.name}</Text>
            <View style={styles.metricStatus}>
              {getStatusIcon(metric.status)}
              <Text
                style={[
                  styles.metricStatusText,
                  { color: getStatusColor(metric.status) },
                ]}
              >
                {currentTexts[metric.status]}
              </Text>
            </View>
          </View>
          <View style={styles.metricTrend}>
            {getTrendIcon(metric.trend)}
            <Text style={styles.metricTrendText}>
              {metric.lastWeekChange > 0 ? "+" : ""}
              {metric.lastWeekChange.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.metricValues}>
          <View style={styles.metricCurrentValue}>
            <Text style={styles.metricValueText}>
              {metric.value.toLocaleString()} {metric.unit}
            </Text>
            <Text style={styles.metricTargetText}>
              יעד: {metric.target.toLocaleString()} {metric.unit}
            </Text>
          </View>
          <View style={styles.metricPercentage}>
            <Text
              style={[styles.metricPercentageText, { color: metric.color }]}
            >
              {metric.percentage}%
            </Text>
          </View>
        </View>

        <View style={styles.metricProgress}>
          <View style={styles.metricProgressBg}>
            <LinearGradient
              colors={[metric.color, `${metric.color}80`]}
              style={[
                styles.metricProgressFill,
                { width: `${Math.min(metric.percentage, 100)}%` },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {metric.recommendation && (
          <View style={styles.metricRecommendation}>
            <Sparkles size={12} color={metric.color} />
            <Text style={styles.metricRecommendationText}>
              {metric.recommendation}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const alerts = getAlertsData();

  if (isLoading && !statisticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color="#F44336" />
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LanguageToolbar helpContent={helpContent} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{currentTexts.title}</Text>
            <Text style={styles.subtitle}>{currentTexts.subtitle}</Text>
          </View>
          <View style={styles.headerIcons}>
            <AccessibilityButton />
            <TouchableOpacity
              style={styles.languageButton}
              onPress={toggleLanguage}
            >
              <Globe size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Filter */}
        <View style={styles.timeFilterContainer}>
          <View style={styles.timeFilter}>
            {timeFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.timeFilterButton,
                  selectedTimeRange === filter.key &&
                    styles.timeFilterButtonActive,
                ]}
                onPress={() => setSelectedTimeRange(filter.key)}
              >
                {selectedTimeRange === filter.key ? (
                  <LinearGradient
                    colors={["#16A085", "#1ABC9C"]}
                    style={styles.timeFilterGradient}
                  >
                    <Text style={styles.timeFilterTextActive}>
                      {filter.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.timeFilterText}>{filter.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gamification Dashboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.gamification}</Text>
          <View style={styles.gamificationContainer}>
            <LinearGradient
              colors={["#9B59B615", "#9B59B605"]}
              style={styles.gamificationGradient}
            >
              {/* Level & XP */}
              <View style={styles.levelContainer}>
                <View style={styles.levelInfo}>
                  <View style={styles.levelIcon}>
                    <Crown size={32} color="#F39C12" />
                  </View>
                  <View style={styles.levelDetails}>
                    <Text style={styles.levelText}>
                      {currentTexts.level} {gamificationStats.level}
                    </Text>
                    <Text style={styles.xpText}>
                      {gamificationStats.currentXP} /{" "}
                      {gamificationStats.nextLevelXP} {currentTexts.xp}
                    </Text>
                  </View>
                </View>
                <View style={styles.xpProgress}>
                  <View style={styles.xpProgressBg}>
                    <LinearGradient
                      colors={["#F39C12", "#E67E22"]}
                      style={[
                        styles.xpProgressFill,
                        { width: `${gamificationStats.xpProgress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.xpToNext}>
                    {gamificationStats.xpToNext} {currentTexts.nextLevel}
                  </Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.gamificationStats}>
                <View style={styles.gamificationStatItem}>
                  <Flame size={20} color="#E74C3C" />
                  <Text style={styles.gamificationStatValue}>
                    {gamificationStats.dailyStreak}
                  </Text>
                  <Text style={styles.gamificationStatLabel}>
                    {currentTexts.dailyStreak}
                  </Text>
                </View>
                <View style={styles.gamificationStatItem}>
                  <Calendar size={20} color="#3498DB" />
                  <Text style={styles.gamificationStatValue}>
                    {gamificationStats.weeklyStreak}
                  </Text>
                  <Text style={styles.gamificationStatLabel}>
                    {currentTexts.weeklyStreak}
                  </Text>
                </View>
                <View style={styles.gamificationStatItem}>
                  <Star size={20} color="#F39C12" />
                  <Text style={styles.gamificationStatValue}>
                    {gamificationStats.perfectDays}
                  </Text>
                  <Text style={styles.gamificationStatLabel}>
                    {currentTexts.perfectDays}
                  </Text>
                </View>
                <View style={styles.gamificationStatItem}>
                  <Trophy size={20} color="#16A085" />
                  <Text style={styles.gamificationStatValue}>
                    {gamificationStats.totalPoints.toLocaleString()}
                  </Text>
                  <Text style={styles.gamificationStatLabel}>
                    {currentTexts.totalPoints}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Achievements & Badges */}
        <View style={styles.section}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>{currentTexts.achievements}</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowAchievements(true)}
            >
              <Text style={styles.viewAllText}>
                {currentTexts.viewAllAchievements}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Achievements */}
          <View style={styles.achievementsContainer}>
            {achievements.slice(0, 3).map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <LinearGradient
                  colors={
                    achievement.unlocked
                      ? [`${achievement.color}15`, `${achievement.color}05`]
                      : ["#E9ECEF15", "#E9ECEF05"]
                  }
                  style={styles.achievementGradient}
                >
                  <View style={styles.achievementContent}>
                    <View
                      style={[
                        styles.achievementIcon,
                        {
                          backgroundColor: achievement.unlocked
                            ? `${achievement.color}20`
                            : "#E9ECEF",
                        },
                      ]}
                    >
                      {achievement.icon}
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressBg}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              {
                                width: `${
                                  (achievement.progress /
                                    achievement.maxProgress) *
                                  100
                                }%`,
                                backgroundColor: achievement.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.achievementProgressText}>
                          {achievement.progress}/{achievement.maxProgress}
                        </Text>
                      </View>
                    </View>
                    {achievement.unlocked && (
                      <View style={styles.achievementBadge}>
                        <CheckCircle size={20} color={achievement.color} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            <Text style={styles.badgesTitle}>{currentTexts.badges}</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={styles.badgeCard}>
                  <LinearGradient
                    colors={[
                      `${getRarityColor(badge.rarity)}15`,
                      `${getRarityColor(badge.rarity)}05`,
                    ]}
                    style={styles.badgeGradient}
                  >
                    <View
                      style={[
                        styles.badgeIcon,
                        { backgroundColor: `${badge.color}20` },
                      ]}
                    >
                      {badge.icon}
                    </View>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDate}>{badge.earnedDate}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Wellbeing Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.wellbeing}</Text>
          <View style={styles.wellbeingContainer}>
            <LinearGradient
              colors={["#16A08515", "#16A08505"]}
              style={styles.wellbeingGradient}
            >
              <View style={styles.wellbeingStats}>
                <View style={styles.wellbeingStatItem}>
                  <View style={styles.wellbeingStatIcon}>
                    <Smile size={20} color="#2ECC71" />
                  </View>
                  <Text style={styles.wellbeingStatValue}>
                    {wellbeingInsights.happyDays}/{wellbeingInsights.totalDays}
                  </Text>
                  <Text style={styles.wellbeingStatLabel}>
                    {currentTexts.mood}
                  </Text>
                </View>

                <View style={styles.wellbeingStatItem}>
                  <View style={styles.wellbeingStatIcon}>
                    <Battery size={20} color="#F39C12" />
                  </View>
                  <Text style={styles.wellbeingStatValue}>
                    {wellbeingInsights.highEnergyDays}/
                    {wellbeingInsights.totalDays}
                  </Text>
                  <Text style={styles.wellbeingStatLabel}>
                    {currentTexts.energy}
                  </Text>
                </View>

                <View style={styles.wellbeingStatItem}>
                  <View style={styles.wellbeingStatIcon}>
                    <Heart size={20} color="#E74C3C" />
                  </View>
                  <Text style={styles.wellbeingStatValue}>
                    {wellbeingInsights.satisfiedDays}/
                    {wellbeingInsights.totalDays}
                  </Text>
                  <Text style={styles.wellbeingStatLabel}>
                    {currentTexts.satiety}
                  </Text>
                </View>

                <View style={styles.wellbeingStatItem}>
                  <View style={styles.wellbeingStatIcon}>
                    <Star size={20} color="#9B59B6" />
                  </View>
                  <Text style={styles.wellbeingStatValue}>
                    {wellbeingInsights.averageMealQuality}/5
                  </Text>
                  <Text style={styles.wellbeingStatLabel}>
                    {currentTexts.mealQuality}
                  </Text>
                </View>
              </View>

              {/* Daily Wellbeing Chart */}
              <View style={styles.wellbeingChart}>
                <Text style={styles.wellbeingChartTitle}>
                  מצב רוח ואנרגיה השבוע
                </Text>
                <View style={styles.wellbeingChartBars}>
                  {weeklyData.map((day, index) => (
                    <View key={index} style={styles.wellbeingDayContainer}>
                      <View style={styles.wellbeingDayIcons}>
                        {getMoodIcon(day.mood || "neutral")}
                        {getEnergyIcon(day.energy || "medium")}
                      </View>
                      <Text style={styles.wellbeingDayLabel}>
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Comparison Feature */}
        <View style={styles.section}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.sectionTitle}>{currentTexts.comparison}</Text>
            <TouchableOpacity
              style={styles.compareButton}
              onPress={() => setShowComparison(true)}
            >
              <ArrowUpDown size={16} color="#16A085" />
              <Text style={styles.compareButtonText}>
                {currentTexts.compareWith}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.comparisonPreview}>
            <LinearGradient
              colors={["#3498DB15", "#3498DB05"]}
              style={styles.comparisonGradient}
            >
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>
                  {currentTexts.thisWeek} vs {currentTexts.lastWeek}
                </Text>
                <View style={styles.comparisonValues}>
                  <View style={styles.comparisonValue}>
                    <Text style={styles.comparisonMetric}>
                      {currentTexts.calories}
                    </Text>
                    <View style={styles.comparisonChange}>
                      <TrendingUp size={14} color="#2ECC71" />
                      <Text
                        style={[
                          styles.comparisonChangeText,
                          { color: "#2ECC71" },
                        ]}
                      >
                        +5.2%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.comparisonValue}>
                    <Text style={styles.comparisonMetric}>
                      {currentTexts.protein}
                    </Text>
                    <View style={styles.comparisonChange}>
                      <TrendingDown size={14} color="#E74C3C" />
                      <Text
                        style={[
                          styles.comparisonChangeText,
                          { color: "#E74C3C" },
                        ]}
                      >
                        -3.1%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.comparisonValue}>
                    <Text style={styles.comparisonMetric}>
                      {currentTexts.water}
                    </Text>
                    <View style={styles.comparisonChange}>
                      <TrendingUp size={14} color="#2ECC71" />
                      <Text
                        style={[
                          styles.comparisonChangeText,
                          { color: "#2ECC71" },
                        ]}
                      >
                        +12.8%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {currentTexts.progressOverview}
          </Text>
          <View style={styles.progressOverviewContainer}>
            <LinearGradient
              colors={["#16A08515", "#16A08505"]}
              style={styles.progressOverviewGradient}
            >
              <View style={styles.progressStatsGrid}>
                <View style={styles.progressStatItem}>
                  <View style={styles.progressStatIcon}>
                    <CheckCircle size={20} color="#2ECC71" />
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.successfulDays}/{progressStats.totalDays}
                  </Text>
                  <Text style={styles.progressStatLabel}>
                    {currentTexts.successfulDays}
                  </Text>
                </View>

                <View style={styles.progressStatItem}>
                  <View style={styles.progressStatIcon}>
                    <Target size={20} color="#3498DB" />
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.averageCompletion}%
                  </Text>
                  <Text style={styles.progressStatLabel}>
                    {currentTexts.averageCompletion}
                  </Text>
                </View>

                <View style={styles.progressStatItem}>
                  <View style={styles.progressStatIcon}>
                    <Award size={20} color="#F39C12" />
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.bestStreak}
                  </Text>
                  <Text style={styles.progressStatLabel}>
                    {currentTexts.bestStreak}
                  </Text>
                </View>

                <View style={styles.progressStatItem}>
                  <View style={styles.progressStatIcon}>
                    <Trophy size={20} color="#E74C3C" />
                  </View>
                  <Text style={styles.progressStatValue}>
                    {progressStats.currentStreak}
                  </Text>
                  <Text style={styles.progressStatLabel}>
                    {currentTexts.currentStreak}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Weekly Progress Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.weeklyProgress}</Text>
          <View style={styles.chartContainer}>
            <LinearGradient
              colors={["#16A08510", "#16A08505"]}
              style={styles.chartGradient}
            >
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>
                  {currentTexts.totalCalories}
                </Text>
                <Text style={styles.chartSubtitle}>7 {currentTexts.days}</Text>
              </View>

              {/* Simple Bar Chart */}
              <View style={styles.chartBars}>
                {weeklyData.map((day, index) => {
                  const percentage =
                    (day.calories /
                      Math.max(...weeklyData.map((d) => d.calories))) *
                    100;
                  return (
                    <View key={index} style={styles.chartBarContainer}>
                      <View style={styles.chartBarBackground}>
                        <LinearGradient
                          colors={["#16A085", "#1ABC9C"]}
                          style={[
                            styles.chartBar,
                            { height: `${percentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartBarLabel}>
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Alerts Section */}
        {showAlerts && alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertsHeader}>
              <Text style={styles.sectionTitle}>
                {currentTexts.alertsTitle}
              </Text>
              <TouchableOpacity
                style={styles.hideAlertsButton}
                onPress={() => setShowAlerts(false)}
              >
                <Text style={styles.hideAlertsText}>
                  {currentTexts.hideAlerts}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.alertsContainer}>
              {alerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <LinearGradient
                    colors={
                      alert.severity === "danger"
                        ? ["#E74C3C15", "#E74C3C05"]
                        : ["#E67E2215", "#E67E2205"]
                    }
                    style={styles.alertGradient}
                  >
                    <View style={styles.alertContent}>
                      <View style={styles.alertIcon}>
                        <AlertTriangle
                          size={20}
                          color={
                            alert.severity === "danger" ? "#E74C3C" : "#E67E22"
                          }
                        />
                      </View>
                      <View style={styles.alertText}>
                        <Text style={styles.alertTitle}>{alert.title}</Text>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Macronutrients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.macronutrients}</Text>
          <View style={styles.metricsGrid}>
            {categorizedMetrics.macros.map(renderMetricCard)}
          </View>
        </View>

        {/* Micronutrients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.micronutrients}</Text>
          <View style={styles.metricsGrid}>
            {categorizedMetrics.micros.map(renderMetricCard)}
          </View>
        </View>

        {/* Lifestyle Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{currentTexts.lifestyle}</Text>
          <View style={styles.metricsGrid}>
            {categorizedMetrics.lifestyle.map(renderMetricCard)}
          </View>
        </View>

        {/* Smart Insights Section */}
        <View style={styles.section}>
          <View style={styles.insightsContainer}>
            <LinearGradient
              colors={["#9B59B615", "#9B59B605"]}
              style={styles.insightsGradient}
            >
              <View style={styles.insightsHeader}>
                <Brain size={24} color="#9B59B6" />
                <Text style={styles.insightsTitle}>
                  {currentTexts.insightTitle}
                </Text>
              </View>
              <View style={styles.insightsList}>
                <View style={styles.insightItem}>
                  <Star size={16} color="#F39C12" />
                  <Text style={styles.insightText}>
                    {currentTexts.proteinInsight}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <TrendingUp size={16} color="#2ECC71" />
                  <Text style={styles.insightText}>
                    {currentTexts.hydrationInsight}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <AlertTriangle size={16} color="#E67E22" />
                  <Text style={styles.insightText}>
                    {currentTexts.fiberInsight}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Meal Summary */}
        {statisticsData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("statistics.meal_summary")}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>
                    {t("statistics.total_meals")}
                  </Text>
                  <Text style={styles.statValue}>
                    {statisticsData.totalMeals}
                  </Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>
                    {t("statistics.total_days")}
                  </Text>
                  <Text style={styles.statValue}>
                    {statisticsData.totalDays}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Achievements Modal */}
        <Modal
          visible={showAchievements}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAchievements(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{currentTexts.achievements}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <LinearGradient
                    colors={
                      achievement.unlocked
                        ? [`${achievement.color}15`, `${achievement.color}05`]
                        : ["#E9ECEF15", "#E9ECEF05"]
                    }
                    style={styles.achievementGradient}
                  >
                    <View style={styles.achievementContent}>
                      <View
                        style={[
                          styles.achievementIcon,
                          {
                            backgroundColor: achievement.unlocked
                              ? `${achievement.color}20`
                              : "#E9ECEF",
                          },
                        ]}
                      >
                        {achievement.icon}
                      </View>
                      <View style={styles.achievementInfo}>
                        <Text style={styles.achievementTitle}>
                          {achievement.title}
                        </Text>
                        <Text style={styles.achievementDescription}>
                          {achievement.description}
                        </Text>
                        <View style={styles.achievementProgress}>
                          <View style={styles.achievementProgressBg}>
                            <View
                              style={[
                                styles.achievementProgressFill,
                                {
                                  width: `${
                                    (achievement.progress /
                                      achievement.maxProgress) *
                                    100
                                  }%`,
                                  backgroundColor: achievement.color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.achievementProgressText}>
                            {achievement.progress}/{achievement.maxProgress}
                          </Text>
                        </View>
                      </View>
                      {achievement.unlocked && (
                        <View style={styles.achievementBadge}>
                          <CheckCircle size={20} color={achievement.color} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Comparison Modal */}
        <Modal
          visible={showComparison}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowComparison(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{currentTexts.comparison}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.comparisonDetailContainer}>
                <LinearGradient
                  colors={["#3498DB15", "#3498DB05"]}
                  style={styles.comparisonDetailGradient}
                >
                  <Text style={styles.comparisonDetailTitle}>
                    {currentTexts.thisWeek} vs {currentTexts.lastWeek}
                  </Text>

                  {/* Detailed comparison metrics */}
                  {[
                    {
                      name: currentTexts.calories,
                      thisWeek: 1823,
                      lastWeek: 1731,
                      unit: currentTexts.kcal,
                    },
                    {
                      name: currentTexts.protein,
                      thisWeek: 95,
                      lastWeek: 98,
                      unit: currentTexts.g,
                    },
                    {
                      name: currentTexts.carbohydrates,
                      thisWeek: 208,
                      lastWeek: 195,
                      unit: currentTexts.g,
                    },
                    {
                      name: currentTexts.fats,
                      thisWeek: 64,
                      lastWeek: 61,
                      unit: currentTexts.g,
                    },
                    {
                      name: currentTexts.hydration,
                      thisWeek: 2100,
                      lastWeek: 1862,
                      unit: currentTexts.ml,
                    },
                  ].map((metric, index) => {
                    const change =
                      ((metric.thisWeek - metric.lastWeek) / metric.lastWeek) *
                      100;
                    const isImprovement = change > 0;

                    return (
                      <View key={index} style={styles.comparisonDetailItem}>
                        <Text style={styles.comparisonDetailMetric}>
                          {metric.name}
                        </Text>
                        <View style={styles.comparisonDetailValues}>
                          <Text style={styles.comparisonDetailValue}>
                            {metric.thisWeek} {metric.unit}
                          </Text>
                          <Text style={styles.comparisonDetailVs}>vs</Text>
                          <Text style={styles.comparisonDetailValue}>
                            {metric.lastWeek} {metric.unit}
                          </Text>
                        </View>
                        <View style={styles.comparisonDetailChange}>
                          {isImprovement ? (
                            <TrendingUp size={16} color="#2ECC71" />
                          ) : (
                            <TrendingDown size={16} color="#E74C3C" />
                          )}
                          <Text
                            style={[
                              styles.comparisonDetailChangeText,
                              { color: isImprovement ? "#2ECC71" : "#E74C3C" },
                            ]}
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </LinearGradient>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerType === "start" ? customStartDate : customEndDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  textRTL: {
    textAlign: "right",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  timeFilter: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  timeFilterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  timeFilterButtonActive: {},
  timeFilterGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  timeFilterText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7F8C8D",
    textAlign: "center",
    paddingVertical: 12,
  },
  timeFilterTextActive: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
  },

  // Gamification
  gamificationContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gamificationGradient: {
    padding: 20,
  },
  levelContainer: {
    marginBottom: 20,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  levelIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  levelDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  xpText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  xpProgress: {
    marginBottom: 8,
  },
  xpProgressBg: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
  },
  gamificationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  gamificationStatItem: {
    alignItems: "center",
  },
  gamificationStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 8,
  },
  gamificationStatLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 4,
    textAlign: "center",
  },

  // Achievements
  achievementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E8F8F5",
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#16A085",
  },
  achievementsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  achievementCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  achievementGradient: {
    padding: 16,
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 8,
  },
  achievementProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  achievementProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  achievementProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Badges
  badgesContainer: {
    marginTop: 20,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: (width - 64) / 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  badgeGradient: {
    padding: 12,
    alignItems: "center",
    minHeight: 80,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: "500",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 8,
    color: "#7F8C8D",
    textAlign: "center",
  },

  // Wellbeing
  wellbeingContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  wellbeingGradient: {
    padding: 20,
  },
  wellbeingStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  wellbeingStatItem: {
    alignItems: "center",
  },
  wellbeingStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  wellbeingStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  wellbeingStatLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginTop: 4,
    textAlign: "center",
  },
  wellbeingChart: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
    paddingTop: 20,
  },
  wellbeingChartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
    textAlign: "center",
  },
  wellbeingChartBars: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  wellbeingDayContainer: {
    alignItems: "center",
  },
  wellbeingDayIcons: {
    flexDirection: "column",
    gap: 4,
    marginBottom: 8,
  },
  wellbeingDayLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
  },

  // Comparison
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E8F8F5",
    borderRadius: 8,
    gap: 6,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#16A085",
  },
  comparisonPreview: {
    borderRadius: 12,
    overflow: "hidden",
  },
  comparisonGradient: {
    padding: 16,
  },
  comparisonItem: {
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
  },
  comparisonValues: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  comparisonValue: {
    alignItems: "center",
  },
  comparisonMetric: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  comparisonChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comparisonChangeText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Progress Overview
  progressOverviewContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  progressOverviewGradient: {
    padding: 20,
  },
  progressStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  progressStatItem: {
    alignItems: "center",
  },
  progressStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  progressStatLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 4,
  },

  // Chart
  chartContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  chartGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  chartBarBackground: {
    width: "80%",
    height: 80,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    borderRadius: 2,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
    marginTop: 8,
  },

  // Alerts
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  hideAlertsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  hideAlertsText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  alertsContainer: {
    gap: 12,
  },
  alertCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  alertGradient: {
    padding: 16,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: "#7F8C8D",
  },

  // Metrics
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  metricGradient: {
    padding: 20,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  metricStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricStatusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  metricTrend: {
    alignItems: "center",
  },
  metricTrendText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
    marginTop: 2,
  },
  metricValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metricCurrentValue: {
    flex: 1,
  },
  metricValueText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  metricTargetText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  metricPercentage: {
    alignItems: "center",
  },
  metricPercentageText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  metricProgress: {
    marginBottom: 12,
  },
  metricProgressBg: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  metricProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  metricRecommendation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metricRecommendationText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2C3E50",
    marginLeft: 8,
  },

  // Insights
  insightsContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  insightsGradient: {
    padding: 20,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 12,
  },
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 16,
    borderRadius: 12,
  },
  insightText: {
    fontSize: 14,
    color: "#2C3E50",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statContent: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Comparison Detail
  comparisonDetailContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  comparisonDetailGradient: {
    padding: 20,
  },
  comparisonDetailTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 20,
    textAlign: "center",
  },
  comparisonDetailItem: {
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  comparisonDetailMetric: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  comparisonDetailValues: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  comparisonDetailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  comparisonDetailVs: {
    fontSize: 14,
    color: "#7F8C8D",
    marginHorizontal: 12,
  },
  comparisonDetailChange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  comparisonDetailChangeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
