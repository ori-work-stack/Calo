import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/services/api";
import { RootState, AppDispatch } from "@/src/store";
import FloatingChatButton from "@/components/FloatingChatButton";
import { fetchMeals } from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface UserStats {
  totalMeals: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
  streakDays: number;
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

const { width } = Dimensions.get("window");

const HomeScreen = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { user } = useSelector((state: RootState) => state.auth);

  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    targetCalories: 1800,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 60,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Refs for preventing overlapping loads and caching
  const isLoadingRef = useRef(false);
  const lastDataLoadRef = useRef<number>(0);
  const lastFocusTimeRef = useRef<number>(0);

  // Memoized calculations to prevent unnecessary re-renders
  const processedMealsData = useMemo(() => {
    if (!meals || meals.length === 0) {
      return {
        recentMeals: [],
        todaysMeals: [],
        dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      };
    }

    const sortedMeals = [...meals].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const today = new Date().toISOString().split("T")[0];
    const todayMeals = meals.filter((meal) =>
      meal.created_at.startsWith(today)
    );

    const dailyTotals = todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      recentMeals: sortedMeals.slice(0, 3),
      todaysMeals: todayMeals,
      dailyTotals,
    };
  }, [meals]);

  // Update daily goals when processed data changes
  const updateDailyGoals = useCallback(() => {
    setDailyGoals((prev) => ({
      ...prev,
      ...processedMealsData.dailyTotals,
    }));
  }, [processedMealsData.dailyTotals]);

  // Optimized user stats loading with caching
  const loadUserStats = useCallback(async () => {
    if (!user?.user_id) return;

    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Skip if we loaded recently
    if (now - lastDataLoadRef.current < CACHE_DURATION) {
      return;
    }

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    try {
      const response = await api.get(`/calendar/statistics/${year}/${month}`);
      if (response.data.success) {
        const stats = response.data.data;
        const summaryStats: UserStats = {
          totalMeals: stats.totalMeals,
          totalCalories: stats.totalCalories,
          avgCaloriesPerDay: stats.avgCaloriesPerDay,
          streakDays: stats.streakDays || 0,
        };
        setUserStats(summaryStats);
        lastDataLoadRef.current = now;
      }
    } catch (error) {
      console.error("💥 Error loading user stats:", error);
    }
  }, [user?.user_id]);

  // Optimized data loading with debouncing
  const loadAllData = useCallback(
    async (force = false) => {
      if (!user?.user_id || isLoadingRef.current) return;

      const now = Date.now();
      const MIN_RELOAD_INTERVAL = 30 * 1000; // 30 seconds minimum between loads

      // Skip if we loaded very recently (unless forced)
      if (!force && now - lastDataLoadRef.current < MIN_RELOAD_INTERVAL) {
        return;
      }

      isLoadingRef.current = true;
      setIsDataLoading(true);

      try {
        // Load stats and meals in parallel
        const [statsResult, mealsResult] = await Promise.allSettled([
          loadUserStats(),
          dispatch(fetchMeals()).unwrap(),
        ]);

        if (statsResult.status === "rejected") {
          console.error("Stats loading failed:", statsResult.reason);
        }
        if (mealsResult.status === "rejected") {
          console.error("Meals loading failed:", mealsResult.reason);
        }

        lastDataLoadRef.current = now;
      } catch (error) {
        console.error("💥 Error loading data:", error);
      } finally {
        setIsDataLoading(false);
        setInitialLoading(false);
        isLoadingRef.current = false;
      }
    },
    [user?.user_id, loadUserStats, dispatch]
  );

  // Optimized refresh with proper state management
  const onRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    try {
      await loadAllData(true); // Force reload on manual refresh
    } finally {
      setRefreshing(false);
    }
  }, [loadAllData, refreshing]);

  // Memoized percentage calculations
  const percentages = useMemo(
    () => ({
      calories: Math.min(
        (dailyGoals.calories / dailyGoals.targetCalories) * 100,
        100
      ),
      protein: Math.min(
        (dailyGoals.protein / dailyGoals.targetProtein) * 100,
        100
      ),
    }),
    [dailyGoals]
  );

  const navigateToCamera = useCallback(() => {
    router.push("/(tabs)/camera");
  }, []);

  // EFFECTS SECTION - All useEffect and useFocusEffect hooks go here
  useEffect(() => {
    updateDailyGoals();
  }, [updateDailyGoals]);

  // Initial load when user id is available
  useEffect(() => {
    if (user?.user_id && initialLoading) {
      loadAllData(true);
    }
  }, [user?.user_id, loadAllData, initialLoading]);

  // Optimized focus effect with throttling
  useFocusEffect(
    useCallback(() => {
      if (!user?.user_id || initialLoading) return;

      const now = Date.now();
      const FOCUS_RELOAD_THROTTLE = 10 * 1000; // 10 seconds minimum between focus reloads

      // Throttle focus-based reloads
      if (now - lastFocusTimeRef.current > FOCUS_RELOAD_THROTTLE) {
        lastFocusTimeRef.current = now;
        loadAllData();
      }
    }, [user?.user_id, initialLoading, loadAllData])
  );

  // NOW WE CAN HAVE CONDITIONAL LOGIC - ALL HOOKS ARE DECLARED ABOVE
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  // Memoized components to prevent unnecessary re-renders
  const QuickActionButton = React.memo(
    ({
      icon,
      title,
      onPress,
      color = "#007AFF",
      gradient = false,
    }: {
      icon: any;
      title: string;
      onPress: () => void;
      color?: string;
      gradient?: boolean;
    }) => {
      const ButtonContent = () => (
        <View style={[styles.quickActionButton, { borderColor: color }]}>
          <Ionicons name={icon} size={28} color={gradient ? "#fff" : color} />
          <Text
            style={[
              styles.quickActionText,
              { color: gradient ? "#fff" : color },
            ]}
          >
            {title}
          </Text>
        </View>
      );

      return (
        <TouchableOpacity onPress={onPress} style={styles.quickActionContainer}>
          {gradient ? (
            <LinearGradient
              colors={[color, `${color}DD`]}
              style={styles.quickActionButton}
            >
              <Ionicons name={icon} size={28} color="#fff" />
              <Text style={[styles.quickActionText, { color: "#fff" }]}>
                {title}
              </Text>
            </LinearGradient>
          ) : (
            <ButtonContent />
          )}
        </TouchableOpacity>
      );
    }
  );

  const CalorieCard = React.memo(() => (
    <View style={styles.calorieCard}>
      <LinearGradient
        colors={["#4ECDC4", "#44A08D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calorieGradient}
      >
        <View style={styles.calorieHeader}>
          <Ionicons name="flame" size={24} color="#fff" />
          <Text style={styles.calorieLabel}>{t("meals.calories")}</Text>
        </View>

        <View style={styles.calorieContent}>
          <Text style={styles.calorieValue}>
            {dailyGoals.calories.toLocaleString()}
          </Text>
          <Text style={styles.calorieTarget}>
            / {dailyGoals.targetCalories.toLocaleString()} {t("meals.calories")}
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${percentages.calories}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(percentages.calories)}%
          </Text>
        </View>

        <View style={styles.calorieFooter}>
          <View style={styles.calorieDetail}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.calorieDetailText}>
              {userStats?.streakDays || 0} {t("home.streak_days")}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  ));

  const NutritionCard = React.memo(() => (
    <View style={styles.nutritionCard}>
      <Text style={styles.nutritionTitle}>{t("home.nutrition_breakdown")}</Text>

      <View style={styles.nutritionItem}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionLabel}>{t("meals.protein")}</Text>
          <Text style={styles.nutritionValue}>
            {Math.round(dailyGoals.protein)}g / {dailyGoals.targetProtein}g
          </Text>
        </View>
        <View style={styles.nutritionProgressBar}>
          <View
            style={[
              styles.nutritionProgressFill,
              {
                width: `${percentages.protein}%`,
                backgroundColor: "#FF6B6B",
              },
            ]}
          />
        </View>
        <Text style={styles.nutritionPercentage}>
          {Math.round(percentages.protein)}%
        </Text>
      </View>

      <View style={styles.macroRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>{t("meals.carbs")}</Text>
          <Text style={styles.macroValue}>{Math.round(dailyGoals.carbs)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>{t("meals.fat")}</Text>
          <Text style={styles.macroValue}>{Math.round(dailyGoals.fat)}g</Text>
        </View>
      </View>
    </View>
  ));

  // Memoized meal card component
  const MealCard = React.memo(
    ({ meal, index }: { meal: Meal; index: number }) => (
      <TouchableOpacity
        key={meal.meal_id || `meal-${index}`}
        style={styles.mealCard}
        onPress={() => router.push(`/(tabs)/history`)}
      >
        {meal.image_url ? (
          <Image
            source={{ uri: meal.image_url }}
            style={styles.mealImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mealPlaceholder}>
            <Ionicons name="restaurant" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>
            {meal.name || t("meals.unknown_meal")}
          </Text>
          <Text style={styles.mealCalories}>
            {meal.calories || 0} {t("meals.cal")}
          </Text>
        </View>
      </TouchableOpacity>
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4ECDC4" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4ECDC4"]}
            tintColor="#4ECDC4"
          />
        }
      >
        {/* Header with gradient */}
        <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.header}>
          <View style={styles.headerContent}>
            <View
              style={[styles.headerText, isRTL && { alignItems: "flex-end" }]}
            >
              <Text style={styles.welcomeText}>
                {t("home.welcome")}
                {user?.name ? `, ${user.name}` : ""}
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString(isRTL ? "he-IL" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                /* Notification functionality */
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Main content */}
        <View style={styles.mainContent}>
          <CalorieCard />
          <NutritionCard />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home.quick_actions")}</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                icon="camera"
                title={t("home.scan_meal")}
                onPress={() => router.push("/(tabs)/food-scanner")}
                color="#4ECDC4"
                gradient
              />
              <QuickActionButton
                icon="add-circle"
                title={t("home.add_meal")}
                onPress={() => router.push("/(tabs)/camera")}
                color="#FF6B6B"
              />
              <QuickActionButton
                icon="restaurant"
                title={t("home.meal_plan")}
                onPress={() => router.push("/(tabs)/history")}
                color="#4ECDC4"
              />
              <QuickActionButton
                icon="stats-chart"
                title={t("home.statistics")}
                onPress={() => router.push("/(tabs)/statistics")}
                color="#9B59B6"
              />
            </View>
          </View>

          {/* Recent Meals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("home.recent_meals")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                <Text style={styles.viewAllText}>{t("common.view_all")}</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#4ECDC4"
                style={styles.loader}
              />
            ) : processedMealsData.recentMeals.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mealsScroll}
              >
                {processedMealsData.recentMeals.map((meal, index) => (
                  <MealCard
                    key={meal.meal_id || `meal-${index}`}
                    meal={meal}
                    index={index}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>{t("meals.no_meals")}</Text>
                <Text style={styles.emptySubtext}>
                  {t("home.add_meal_hint")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <FloatingChatButton />
    </SafeAreaView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  notificationButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 20,
  },
  calorieCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  calorieGradient: {
    padding: 20,
  },
  calorieHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  calorieLabel: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  calorieContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  calorieTarget: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    minWidth: 40,
  },
  calorieFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calorieDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  calorieDetailText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 4,
  },
  nutritionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  nutritionItem: {
    marginBottom: 15,
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  nutritionValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  nutritionProgressBar: {
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    marginBottom: 4,
  },
  nutritionProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  nutritionPercentage: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionContainer: {
    width: "48%",
    marginBottom: 10,
  },
  quickActionButton: {
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  mealsScroll: {
    marginBottom: 10,
  },
  mealCard: {
    width: width * 0.3,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mealImage: {
    width: "100%",
    height: 80,
  },
  mealPlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  mealInfo: {
    padding: 8,
  },
  mealName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 11,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
