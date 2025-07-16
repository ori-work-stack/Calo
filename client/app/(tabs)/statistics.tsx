import React, { useState, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
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
  Sparkles,
  Timer,
  Scale,
  Brain,
  Award,
  Trophy,
  Star,
  Crown,
  Smile,
  Meh,
  Frown,
  Battery,
  X,
} from "lucide-react-native";
import { useStatistics } from "@/hooks/useQueries";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const { width } = Dimensions.get("window");

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

interface TimeFilter {
  key: "today" | "week" | "month";
  label: string;
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("week");
  const [showAlerts, setShowAlerts] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get statistics data with proper error handling
  const {
    data: statisticsResponse,
    isLoading,
    error,
    refetch,
    data,
  } = useStatistics(selectedPeriod);

  // Safely extract statistics data with fallbacks
  const statisticsData = statisticsResponse?.data || null;
  const hasData = statisticsData && statisticsResponse?.success;

  const texts = {
    title: language === "he" ? "התקדמות וסטטיסטיקות" : "Progress & Statistics",
    subtitle:
      language === "he"
        ? "מעקב מפורט אחר 15 מדדי תזונה מרכזיים והתקדמות אישית"
        : "Detailed tracking of 15 key nutritional metrics and personal progress",
    today: language === "he" ? "היום" : "Today",
    week: language === "he" ? "שבוע" : "Week",
    month: language === "he" ? "חודש" : "Month",
    macronutrients: language === "he" ? "מקרו נוטריינטים" : "Macronutrients",
    micronutrients: language === "he" ? "מיקרו נוטריינטים" : "Micronutrients",
    lifestyle: language === "he" ? "אורח חיים" : "Lifestyle",
    quality: language === "he" ? "איכות תזונה" : "Nutrition Quality",
    alerts: language === "he" ? "התראות" : "Alerts",
    recommendations: language === "he" ? "המלצות" : "Recommendations",
    trend: language === "he" ? "מגמה" : "Trend",
    weeklyAverage: language === "he" ? "ממוצע שבועי" : "Weekly Average",
    change: language === "he" ? "שינוי" : "Change",
    excellent: language === "he" ? "מעולה" : "Excellent",
    good: language === "he" ? "טוב" : "Good",
    warning: language === "he" ? "זהירות" : "Warning",
    danger: language === "he" ? "חריגה" : "Out of Range",
    viewDetails: language === "he" ? "צפה בפרטים" : "View Details",
    hideAlerts: language === "he" ? "הסתר התראות" : "Hide Alerts",
    showAlerts: language === "he" ? "הצג התראות" : "Show Alerts",
    noAlerts: language === "he" ? "אין התראות כרגע" : "No alerts at the moment",
    alertsTitle: language === "he" ? "התראות חשובות" : "Important Alerts",
    progressOverview: language === "he" ? "סקירת התקדמות" : "Progress Overview",
    weeklyProgress: language === "he" ? "התקדמות שבועית" : "Weekly Progress",
    achievements: language === "he" ? "הישגים" : "Achievements",
    insights: language === "he" ? "תובנות אישיות" : "Personal Insights",
    gamification: language === "he" ? "גיימיפיקציה" : "Gamification",
    badges: language === "he" ? "תגים" : "Badges",
    streaks: language === "he" ? "רצפים" : "Streaks",
    comparison: language === "he" ? "השוואה" : "Comparison",
    wellbeing: language === "he" ? "רווחה" : "Wellbeing",
    level: language === "he" ? "רמה" : "Level",
    xp: language === "he" ? "נק׳ ניסיון" : "XP",
    nextLevel: language === "he" ? "לרמה הבאה" : "To Next Level",
    dailyStreak: language === "he" ? "רצף יומי" : "Daily Streak",
    weeklyStreak: language === "he" ? "רצף שבועי" : "Weekly Streak",
    perfectDays: language === "he" ? "ימים מושלמים" : "Perfect Days",
    totalPoints: language === "he" ? 'סה"כ נקודות' : "Total Points",
    viewAllAchievements:
      language === "he" ? "צפה בכל הישגים" : "View All Achievements",
    unlocked: language === "he" ? "נפתח" : "Unlocked",
    locked: language === "he" ? "נעול" : "Locked",
    progress: language === "he" ? "התקדמות" : "Progress",
    compareWith: language === "he" ? "השווה עם" : "Compare With",
    lastWeek: language === "he" ? "השבוע שעבר" : "Last Week",
    lastMonth: language === "he" ? "החודש שעבר" : "Last Month",
    thisWeek: language === "he" ? "השבוע" : "This Week",
    thisMonth: language === "he" ? "החודש" : "This Month",
    improvement: language === "he" ? "שיפור" : "Improvement",
    decline: language === "he" ? "ירידה" : "Decline",
    stable: language === "he" ? "יציב" : "Stable",
    mood: language === "he" ? "מצב רוח" : "Mood",
    energy: language === "he" ? "אנרגיה" : "Energy",
    satiety: language === "he" ? "שובע" : "Satiety",
    mealQuality: language === "he" ? "איכות ארוחה" : "Meal Quality",
    happy: language === "he" ? "שמח" : "Happy",
    neutral: language === "he" ? "ניטרלי" : "Neutral",
    sad: language === "he" ? "עצוב" : "Sad",
    high: language === "he" ? "גבוה" : "High",
    medium: language === "he" ? "בינוני" : "Medium",
    low: language === "he" ? "נמוך" : "Low",
    veryFull: language === "he" ? "שבע מאוד" : "Very Full",
    satisfied: language === "he" ? "מרוצה" : "Satisfied",
    hungry: language === "he" ? "רעב" : "Hungry",
    averageDaily: language === "he" ? "ממוצע יומי" : "Daily Average",
    totalConsumed: language === "he" ? 'סה"כ נצרך' : "Total Consumed",
    goalAchieved: language === "he" ? "יעד הושג" : "Goal Achieved",
    streak: language === "he" ? "רצף ימים" : "Day Streak",
    days: language === "he" ? "ימים" : "days",
    bestDay: language === "he" ? "היום הטוב ביותר" : "Best Day",
    improvementArea: language === "he" ? "אזור לשיפור" : "Improvement Area",
    successfulDays: language === "he" ? "ימים מוצלחים" : "Successful Days",
    averageCompletion: language === "he" ? "ממוצע השלמה" : "Average Completion",
    bestStreak: language === "he" ? "רצף הטוב ביותר" : "Best Streak",
    currentStreak: language === "he" ? "רצף נוכחי" : "Current Streak",
    totalCalories:
      language === "he" ? 'סה"כ קלוריות יומיות' : "Total Daily Calories",
    protein: language === "he" ? "חלבון" : "Protein",
    carbohydrates: language === "he" ? "פחמימות" : "Carbohydrates",
    fats: language === "he" ? "שומנים" : "Fats",
    fiber: language === "he" ? "סיבים תזונתיים" : "Dietary Fiber",
    sugars: language === "he" ? "סוכרים" : "Sugars",
    sodium: language === "he" ? "נתרן" : "Sodium",
    hydration: language === "he" ? "רמת הידרציה" : "Hydration Level",
    kcal: language === "he" ? 'קק"ל' : "kcal",
    g: language === "he" ? "גר׳" : "g",
    mg: language === "he" ? 'מ"ג' : "mg",
    ml: language === "he" ? 'מ"ל' : "ml",
    percent: "%",
    score: language === "he" ? "ניקוד" : "score",
    meals: language === "he" ? "ארוחות" : "meals",
    hours: language === "he" ? "שעות" : "hours",
    increaseIntake:
      t("statistics.increase_intake") ||
      (language === "he" ? "הגדל צריכה" : "Increase intake"),
    decreaseIntake:
      t("statistics.decrease_intake") ||
      (language === "he" ? "הפחת צריכה" : "Decrease intake"),
    maintainLevel:
      t("statistics.maintain_level") ||
      (language === "he" ? "שמור על הרמה" : "Maintain level"),
    consultDoctor:
      t("statistics.consult_doctor") ||
      (language === "he" ? "התייעץ עם רופא" : "Consult doctor"),
    addSupplement:
      t("statistics.add_supplement") ||
      (language === "he" ? "שקול תוסף תזונה" : "Consider supplement"),
    improveHydration:
      t("statistics.improve_hydration") ||
      (language === "he" ? "שפר הידרציה" : "Improve hydration"),
    balanceMeals:
      t("statistics.balance_meals") ||
      (language === "he" ? "איזן זמני ארוחות" : "Balance meal timing"),
    increaseFiber:
      t("statistics.increase_fiber") ||
      (language === "he" ? "הוסף סיבים תזונתיים" : "Add fiber sources"),
    reduceSodium:
      t("statistics.reduce_sodium") ||
      (language === "he" ? "הפחת נתרן" : "Reduce sodium"),
    addOmega3:
      t("statistics.add_omega3") ||
      (language === "he" ? "הוסף מקורות אומגה 3" : "Add omega-3 sources"),
    insightTitle:
      language === "he"
        ? "תובנות חכמות מבוססות נתונים"
        : "Smart Data-Driven Insights",
    noDataMessage:
      language === "he"
        ? "אין נתונים זמינים לתקופה זו"
        : "No data available for this period",
    loadingMessage: language === "he" ? "טוען נתונים..." : "Loading data...",
    errorMessage:
      language === "he" ? "שגיאה בטעינת הנתונים" : "Error loading data",
    retryButton: language === "he" ? "נסה שוב" : "Retry",
  };

  // Generate nutrition data from real API response
  const generateNutritionMetrics = (): NutritionMetric[] => {
    if (!statisticsData) {
      return [];
    }

    const calculateTrend = (
      current: number,
      target: number
    ): "up" | "down" | "stable" => {
      const ratio = current / target;
      if (ratio > 1.1) return "up";
      if (ratio < 0.9) return "down";
      return "stable";
    };

    const calculateWeeklyChange = (
      current: number,
      previous: number
    ): number => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const baseData = [
      {
        id: "calories",
        name: texts.totalCalories,
        nameEn: "Total Calories",
        value: statisticsData?.average_calories_daily || 0,
        target: 1800,
        unit: texts.kcal,
        icon: <Flame size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "macros" as const,
        description:
          language === "he"
            ? "צריכת קלוריות יומית כוללת"
            : "Total daily calorie intake",
        trend: calculateTrend(
          statisticsData?.average_calories_daily || 0,
          1800
        ),
        weeklyAverage: statisticsData?.average_calories_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_calories_daily || 0,
          statisticsData?.previous_calories_daily ||
            statisticsData?.average_calories_daily ||
            0
        ),
      },
      {
        id: "protein",
        name: texts.protein,
        nameEn: "Protein",
        value: statisticsData?.average_protein_daily || 0,
        target: 120,
        unit: texts.g,
        icon: <Zap size={20} color="#9B59B6" />,
        color: "#9B59B6",
        category: "macros" as const,
        description:
          language === "he"
            ? "חלבון לבניית שרירים ותיקון רקמות"
            : "Protein for muscle building and tissue repair",
        trend: calculateTrend(statisticsData?.average_protein_daily || 0, 120),
        weeklyAverage: statisticsData?.average_protein_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_protein_daily || 0,
          statisticsData?.previous_protein_daily ||
            statisticsData?.average_protein_daily ||
            0
        ),
      },
      {
        id: "carbs",
        name: texts.carbohydrates,
        nameEn: "Carbohydrates",
        value: statisticsData?.average_carbs_daily || 0,
        target: 225,
        unit: texts.g,
        icon: <Wheat size={20} color="#F39C12" />,
        color: "#F39C12",
        category: "macros" as const,
        description:
          language === "he"
            ? "פחמימות לאנרגיה ותפקוד המוח"
            : "Carbohydrates for energy and brain function",
        trend: calculateTrend(statisticsData?.average_carbs_daily || 0, 225),
        weeklyAverage: statisticsData?.average_carbs_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_carbs_daily || 0,
          statisticsData?.previous_carbs_daily ||
            statisticsData?.average_carbs_daily ||
            0
        ),
      },
      {
        id: "fats",
        name: texts.fats,
        nameEn: "Fats",
        value: statisticsData?.average_fats_daily || 0,
        target: 70,
        unit: texts.g,
        icon: <Fish size={20} color="#16A085" />,
        color: "#16A085",
        category: "macros" as const,
        description:
          language === "he"
            ? "שומנים בריאים לתפקוד הורמונלי"
            : "Healthy fats for hormonal function",
        trend: calculateTrend(statisticsData?.average_fats_daily || 0, 70),
        weeklyAverage: statisticsData?.average_fats_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_fats_daily || 0,
          statisticsData?.previous_fats_daily ||
            statisticsData?.average_fats_daily ||
            0
        ),
      },
      {
        id: "fiber",
        name: texts.fiber,
        nameEn: "Fiber",
        value: statisticsData?.average_fiber_daily || 0,
        target: 25,
        unit: texts.g,
        icon: <Leaf size={20} color="#27AE60" />,
        color: "#27AE60",
        category: "micros" as const,
        description:
          language === "he"
            ? "סיבים תזונתיים לבריאות העיכול"
            : "Dietary fiber for digestive health",
        recommendation: texts.increaseFiber,
        trend: calculateTrend(statisticsData?.average_fiber_daily || 0, 25),
        weeklyAverage: statisticsData?.average_fiber_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_fiber_daily || 0,
          statisticsData?.previous_fiber_daily ||
            statisticsData?.average_fiber_daily ||
            0
        ),
      },
      {
        id: "sugars",
        name: texts.sugars,
        nameEn: "Sugars",
        value: statisticsData?.average_sugar_daily || 0,
        target: 50,
        maxTarget: 50,
        unit: texts.g,
        icon: <Apple size={20} color="#E67E22" />,
        color: "#E67E22",
        category: "micros" as const,
        description:
          language === "he"
            ? "סוכרים פשוטים - מומלץ להגביל"
            : "Simple sugars - recommended to limit",
        recommendation: texts.decreaseIntake,
        trend: calculateTrend(statisticsData?.average_sugar_daily || 0, 50),
        weeklyAverage: statisticsData?.average_sugar_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_sugar_daily || 0,
          statisticsData?.previous_sugar_daily ||
            statisticsData?.average_sugar_daily ||
            0
        ),
      },
      {
        id: "sodium",
        name: texts.sodium,
        nameEn: "Sodium",
        value: statisticsData?.average_sodium_daily || 0,
        target: 2300,
        maxTarget: 2300,
        unit: texts.mg,
        icon: <Shield size={20} color="#E74C3C" />,
        color: "#E74C3C",
        category: "micros" as const,
        description:
          language === "he"
            ? "נתרן - חשוב להגביל למניעת יתר לחץ דם"
            : "Sodium - important to limit to prevent hypertension",
        recommendation: texts.reduceSodium,
        trend: calculateTrend(statisticsData?.average_sodium_daily || 0, 2300),
        weeklyAverage: statisticsData?.average_sodium_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_sodium_daily || 0,
          statisticsData?.previous_sodium_daily ||
            statisticsData?.average_sodium_daily ||
            0
        ),
      },
      {
        id: "hydration",
        name: texts.hydration,
        nameEn: "Hydration",
        value: statisticsData?.average_fluids_daily || 0,
        target: 2500,
        unit: texts.ml,
        icon: <Droplets size={20} color="#3498DB" />,
        color: "#3498DB",
        category: "lifestyle" as const,
        description:
          language === "he" ? "רמת הידרציה יומית" : "Daily hydration level",
        recommendation: texts.improveHydration,
        trend: calculateTrend(statisticsData?.average_fluids_daily || 0, 2500),
        weeklyAverage: statisticsData?.average_fluids_daily || 0,
        lastWeekChange: calculateWeeklyChange(
          statisticsData?.average_fluids_daily || 0,
          statisticsData?.previous_fluids_daily ||
            statisticsData?.average_fluids_daily ||
            0
        ),
      },
    ];

    return baseData.map((metric) => {
      const percentage = metric.maxTarget
        ? Math.min((metric.target / Math.max(metric.value, 1)) * 100, 100)
        : Math.min((metric.value / Math.max(metric.target, 1)) * 100, 100);

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
  };

  // Generate weekly progress data from real API data
  const generateWeeklyData = (): ProgressData[] => {
    if (
      !statisticsData?.dailyBreakdown ||
      statisticsData.dailyBreakdown.length === 0
    ) {
      return [];
    }

    return statisticsData.dailyBreakdown.map(
      (day: {
        date: any;
        calories: any;
        protein_g: any;
        carbs_g: any;
        fats_g: any;
        liquids_ml: any;
        weight_kg: any;
        mood: string;
        energy: string;
        satiety: string;
        meal_quality: any;
      }) => ({
        date: day.date,
        calories: day.calories || 0,
        protein: day.protein_g || 0,
        carbs: day.carbs_g || 0,
        fats: day.fats_g || 0,
        water: day.liquids_ml || 0,
        weight: day.weight_kg,
        mood: (day.mood as "happy" | "neutral" | "sad") || "neutral",
        energy: (day.energy as "high" | "medium" | "low") || "medium",
        satiety:
          (day.satiety as "very_full" | "satisfied" | "hungry") || "satisfied",
        mealQuality: day.meal_quality || 3,
      })
    );
  };

  // Generate achievements from real API data
  const generateAchievements = (): Achievement[] => {
    if (!statisticsData?.achievements) return [];

    return statisticsData.achievements.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: getAchievementIcon(achievement.category),
      color: getAchievementColor(achievement.category),
      progress: achievement.progress,
      maxProgress: achievement.max_progress,
      unlocked: achievement.unlocked,
      category: achievement.category,
    }));
  };

  // Generate badges from real API data
  const generateBadges = (): Badge[] => {
    if (!statisticsData?.badges) return [];

    return statisticsData.badges.map((badge: any) => ({
      id: badge.id,
      name: badge.name,
      icon: getBadgeIcon(badge.name),
      color: getBadgeColor(badge.rarity),
      earnedDate: new Date(badge.earned_date).toLocaleDateString(),
      rarity: badge.rarity.toLowerCase(),
    }));
  };

  // Helper functions for icons and colors
  const getAchievementIcon = (category: string) => {
    switch (category) {
      case "STREAK":
        return <Flame size={24} color="#E74C3C" />;
      case "GOAL":
        return <Target size={24} color="#16A085" />;
      case "IMPROVEMENT":
        return <TrendingUp size={24} color="#9B59B6" />;
      case "CONSISTENCY":
        return <Star size={24} color="#F39C12" />;
      default:
        return <Award size={24} color="#95A5A6" />;
    }
  };

  const getAchievementColor = (category: string) => {
    switch (category) {
      case "STREAK":
        return "#E74C3C";
      case "GOAL":
        return "#16A085";
      case "IMPROVEMENT":
        return "#9B59B6";
      case "CONSISTENCY":
        return "#F39C12";
      default:
        return "#95A5A6";
    }
  };

  const getBadgeIcon = (name: string) => {
    if (
      name.toLowerCase().includes("water") ||
      name.toLowerCase().includes("מים")
    ) {
      return <Droplets size={20} color="#3498DB" />;
    } else if (
      name.toLowerCase().includes("protein") ||
      name.toLowerCase().includes("חלבון")
    ) {
      return <Zap size={20} color="#9B59B6" />;
    } else if (
      name.toLowerCase().includes("streak") ||
      name.toLowerCase().includes("רצף")
    ) {
      return <Flame size={20} color="#E74C3C" />;
    } else {
      return <Star size={20} color="#F39C12" />;
    }
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
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

  const [metrics, setMetrics] = useState<NutritionMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [achievements] = useState<Achievement[]>(generateAchievements());
  const [badges] = useState<Badge[]>(generateBadges());

  // Update metrics when data changes
  useEffect(() => {
    // Always generate metrics and weekly data, even with limited data
    setMetrics(generateNutritionMetrics());
    setWeeklyData(generateWeeklyData());
  }, [statisticsData, isLoading]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const timeFilters: TimeFilter[] = [
    { key: "today", label: texts.today },
    { key: "week", label: texts.week },
    { key: "month", label: texts.month },
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
            ? texts.consultDoctor
            : texts.maintainLevel),
        severity: metric.status,
        icon: metric.icon,
      }));
  };

  // Calculate progress statistics
  const calculateProgressStats = () => {
    const goals = {
      calories: 1800,
      protein: 120,
      carbs: 225,
      fats: 70,
      water: 2500,
    };
    const averages = {
      calories: Math.round(
        weeklyData.reduce((sum, day) => sum + day.calories, 0) /
          Math.max(weeklyData.length, 1)
      ),
      protein: Math.round(
        weeklyData.reduce((sum, day) => sum + day.protein, 0) /
          Math.max(weeklyData.length, 1)
      ),
      carbs: Math.round(
        weeklyData.reduce((sum, day) => sum + day.carbs, 0) /
          Math.max(weeklyData.length, 1)
      ),
      fats: Math.round(
        weeklyData.reduce((sum, day) => sum + day.fats, 0) /
          Math.max(weeklyData.length, 1)
      ),
      water: Math.round(
        weeklyData.reduce((sum, day) => sum + day.water, 0) /
          Math.max(weeklyData.length, 1)
      ),
    };

    const successfulDays = weeklyData.filter(
      (day) =>
        Math.abs(day.calories - goals.calories) <= 100 &&
        day.protein >= goals.protein * 0.8 &&
        day.water >= goals.water * 0.8
    ).length;

    const averageCompletion = Math.round(
      ((averages.calories / goals.calories +
        averages.protein / goals.protein +
        averages.water / goals.water) /
        3) *
        100
    );

    return {
      totalDays: weeklyData.length,
      successfulDays,
      averageCompletion,
      bestStreak: 4,
      currentStreak: 2,
      averages,
    };
  };

  // Calculate gamification stats from real data
  const calculateGamificationStats = () => {
    const totalPoints = statisticsData?.totalPoints || 0;
    const level = Math.floor(totalPoints / 1000) + 1;
    const currentXP = totalPoints % 1000;
    const nextLevelXP = 1000;
    const dailyStreak = statisticsData?.currentStreak || 0;
    const weeklyStreak = statisticsData?.weeklyStreak || 0;
    const perfectDays = statisticsData?.perfectDays || 0;

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
      Math.max(weeklyData.length, 1);

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
                {texts[metric.status]}
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
              {language === "he" ? "יעד" : "Target"}:{" "}
              {metric.target.toLocaleString()} {metric.unit}
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A085" />
          <Text style={styles.loadingText}>{texts.loadingMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{texts.errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{texts.retryButton}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#16A085"]}
            tintColor="#16A085"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{texts.title}</Text>
            <Text style={styles.subtitle}>{texts.subtitle}</Text>
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
                  selectedPeriod === filter.key &&
                    styles.timeFilterButtonActive,
                ]}
                onPress={() => setSelectedPeriod(filter.key)}
              >
                {selectedPeriod === filter.key ? (
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

        {/* No Data Message */}
        {!hasData && !isLoading && (
          <View style={styles.noDataContainer}>
            <BarChart3 size={64} color="#BDC3C7" />
            <Text style={styles.noDataText}>{texts.noDataMessage}</Text>
          </View>
        )}

        {/* Always show content, use fallback data when needed */}
        {
          <>
            {/* Gamification Dashboard */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.gamification}</Text>
              <View style={styles.gamificationContainer}>
                <LinearGradient
                  colors={["#9B59B615", "#9B59B605"]}
                  style={styles.gamificationGradient}
                >
                  <View style={styles.levelContainer}>
                    <View style={styles.levelInfo}>
                      <View style={styles.levelIcon}>
                        <Crown size={32} color="#F39C12" />
                      </View>
                      <View style={styles.levelDetails}>
                        <Text style={styles.levelText}>
                          {texts.level} {gamificationStats.level}
                        </Text>
                        <Text style={styles.xpText}>
                          {gamificationStats.currentXP} /{" "}
                          {gamificationStats.nextLevelXP} {texts.xp}
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
                        {gamificationStats.xpToNext} {texts.nextLevel}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gamificationStats}>
                    <View style={styles.gamificationStatItem}>
                      <Flame size={20} color="#E74C3C" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.dailyStreak}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.dailyStreak}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Calendar size={20} color="#3498DB" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.weeklyStreak}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.weeklyStreak}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Star size={20} color="#F39C12" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.perfectDays}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.perfectDays}
                      </Text>
                    </View>
                    <View style={styles.gamificationStatItem}>
                      <Trophy size={20} color="#16A085" />
                      <Text style={styles.gamificationStatValue}>
                        {gamificationStats.totalPoints.toLocaleString()}
                      </Text>
                      <Text style={styles.gamificationStatLabel}>
                        {texts.totalPoints}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Achievements & Badges */}
            <View style={styles.section}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.sectionTitle}>{texts.achievements}</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setShowAchievements(true)}
                >
                  <Text style={styles.viewAllText}>
                    {texts.viewAllAchievements}
                  </Text>
                </TouchableOpacity>
              </View>

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

              <View style={styles.badgesContainer}>
                <Text style={styles.badgesTitle}>{texts.badges}</Text>
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
              <Text style={styles.sectionTitle}>{texts.wellbeing}</Text>
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
                        {wellbeingInsights.happyDays}/
                        {wellbeingInsights.totalDays}
                      </Text>
                      <Text style={styles.wellbeingStatLabel}>
                        {texts.mood}
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
                        {texts.energy}
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
                        {texts.satiety}
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
                        {texts.mealQuality}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.wellbeingChart}>
                    <Text style={styles.wellbeingChartTitle}>
                      {language === "he"
                        ? "מצב רוח ואנרגיה השבוע"
                        : "Mood and Energy This Week"}
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

            {/* Progress Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.progressOverview}</Text>
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
                        {texts.successfulDays}
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
                        {texts.averageCompletion}
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
                        {texts.bestStreak}
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
                        {texts.currentStreak}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Weekly Progress Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.weeklyProgress}</Text>
              <View style={styles.chartContainer}>
                <LinearGradient
                  colors={["#16A08510", "#16A08505"]}
                  style={styles.chartGradient}
                >
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>{texts.totalCalories}</Text>
                    <Text style={styles.chartSubtitle}>7 {texts.days}</Text>
                  </View>

                  <View style={styles.chartBars}>
                    {weeklyData.map((day, index) => {
                      const maxCalories = Math.max(
                        ...weeklyData.map((d) => d.calories)
                      );
                      const percentage =
                        maxCalories > 0
                          ? (day.calories / maxCalories) * 100
                          : 0;
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
                  <Text style={styles.sectionTitle}>{texts.alertsTitle}</Text>
                  <TouchableOpacity
                    style={styles.hideAlertsButton}
                    onPress={() => setShowAlerts(false)}
                  >
                    <Text style={styles.hideAlertsText}>
                      {texts.hideAlerts}
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
                                alert.severity === "danger"
                                  ? "#E74C3C"
                                  : "#E67E22"
                              }
                            />
                          </View>
                          <View style={styles.alertText}>
                            <Text style={styles.alertTitle}>{alert.title}</Text>
                            <Text style={styles.alertMessage}>
                              {alert.message}
                            </Text>
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
              <Text style={styles.sectionTitle}>{texts.macronutrients}</Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.macros.map(renderMetricCard)}
              </View>
            </View>

            {/* Micronutrients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.micronutrients}</Text>
              <View style={styles.metricsGrid}>
                {categorizedMetrics.micros.map(renderMetricCard)}
              </View>
            </View>

            {/* Lifestyle Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{texts.lifestyle}</Text>
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
                      {texts.insightTitle}
                    </Text>
                  </View>
                  <View style={styles.insightsList}>
                    <View style={styles.insightItem}>
                      <Star size={16} color="#F39C12" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "אתה עומד ביעד החלבון ב-85% מהימים השבוע - מעולה לבניית שרירים!"
                          : "You're meeting protein goals 85% of days this week - excellent for muscle building!"}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <TrendingUp size={16} color="#2ECC71" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "צריכת המים שלך השתפרה ב-23% השבוע - המשך כך!"
                          : "Your water intake improved by 23% this week - keep it up!"}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <AlertTriangle size={16} color="#E67E22" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "הסיבים התזונתיים נמוכים מהמומלץ - הוסף יותר ירקות וקטניות."
                          : "Dietary fiber is below recommended - add more vegetables and legumes."}
                      </Text>
                    </View>
                    <View style={styles.insightItem}>
                      <Shield size={16} color="#E74C3C" />
                      <Text style={styles.insightText}>
                        {language === "he"
                          ? "רמת הנתרן גבוהה - נסה להפחית מזון מעובד ותבלינים."
                          : "Sodium levels are high - try reducing processed foods and seasonings."}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </>
        }

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
              <Text style={styles.modalTitle}>{texts.achievements}</Text>
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
      </ScrollView>
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
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7F8C8D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A085",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
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
});
