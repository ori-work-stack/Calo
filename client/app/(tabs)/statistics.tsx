import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { nutritionAPI } from "@/src/services/api";

const { width } = Dimensions.get("window");

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

  // You can add dailyBreakdown here too, depending on your data structure
  dailyBreakdown?: any[]; // Or type it properly if known
}

interface DateRange {
  start: string;
  end: string;
}

const TIME_RANGES = {
  today: "today",
  week: "week",
  month: "month",
  custom: "custom",
} as const;

type TimeRangeType = (typeof TIME_RANGES)[keyof typeof TIME_RANGES];

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // State management
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRangeType>(
    TIME_RANGES.week
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<"start" | "end">(
    "start"
  );
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format date as YYYY-MM-DD with extensive validation
  const formatDateString = useCallback((date: Date): string => {
    try {
      // Multiple validation checks
      if (!date) {
        console.warn("Date is null/undefined, using current date");
        date = new Date();
      }

      if (!(date instanceof Date)) {
        console.warn("Invalid date object, creating new Date");
        date = new Date(date);
      }

      if (isNaN(date.getTime())) {
        console.warn("Date is NaN, using current date");
        date = new Date();
      }

      // Use multiple formatting methods as fallbacks
      let formattedDate: string;

      // Method 1: Manual formatting
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      } catch (error) {
        console.error("Manual formatting failed:", error);
        // Method 2: ISO string splitting
        formattedDate = date.toISOString().split("T")[0];
      }

      // Final validation of the formatted string
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formattedDate)) {
        console.error("Invalid date format produced:", formattedDate);
        // Emergency fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      }

      console.log("📅 Final formatted date:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Complete date formatting failure:", error);
      // Ultimate fallback - hardcoded current date
      const now = new Date();
      return now.toISOString().split("T")[0];
    }
  }, []);

  // Get date range based on selected time range with better error handling
  const getDateRange = useCallback((): DateRange => {
    try {
      const now = new Date();

      // Ensure we have a valid current date
      if (isNaN(now.getTime())) {
        console.error("Current date is invalid");
        throw new Error("System date is invalid");
      }

      const today = formatDateString(now);
      console.log("📅 Today formatted as:", today);

      switch (activeTimeRange) {
        case TIME_RANGES.today:
          return { start: today, end: today };

        case TIME_RANGES.week:
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6);
          const weekStartStr = formatDateString(weekStart);
          console.log("📅 Week range:", weekStartStr, "to", today);
          return { start: weekStartStr, end: today };

        case TIME_RANGES.month:
          const monthStart = new Date(now);
          monthStart.setDate(now.getDate() - 29);
          const monthStartStr = formatDateString(monthStart);
          console.log("📅 Month range:", monthStartStr, "to", today);
          return { start: monthStartStr, end: today };

        case TIME_RANGES.custom:
          const customStart = formatDateString(customStartDate);
          const customEnd = formatDateString(customEndDate);
          console.log("📅 Custom range:", customStart, "to", customEnd);
          return { start: customStart, end: customEnd };

        default:
          console.warn("Unknown time range, defaulting to today");
          return { start: today, end: today };
      }
    } catch (error) {
      console.error("Error in getDateRange:", error);
      // Emergency fallback
      const fallbackDate = new Date().toISOString().split("T")[0];
      return { start: fallbackDate, end: fallbackDate };
    }
  }, [activeTimeRange, customStartDate, customEndDate, formatDateString]);

  // Test function to debug date issues
  const testDateFormatting = useCallback(() => {
    console.log("🧪 Testing date formatting:");

    const testDates = [
      new Date(),
      new Date("2024-01-01"),
      customStartDate,
      customEndDate,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ];

    testDates.forEach((date, index) => {
      try {
        const formatted = formatDateString(date);
        console.log(`Test ${index + 1}: ${date} -> ${formatted}`);
      } catch (error) {
        console.error(`Test ${index + 1} failed:`, error);
      }
    });

    const { start, end } = getDateRange();
    console.log("Current range:", { start, end });

    // Test API URL construction
    console.log(
      "API URL would be:",
      `/nutrition/stats/range?start=${start}&end=${end}`
    );
  }, [formatDateString, getDateRange, customStartDate, customEndDate]);

  // Load statistics data with enhanced debugging
  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();

      // Extensive debugging
      console.log("🔍 Debug Info:");
      console.log("- Active Time Range:", activeTimeRange);
      console.log("- Custom Start Date:", customStartDate);
      console.log("- Custom End Date:", customEndDate);
      console.log("- Calculated Start:", start);
      console.log("- Calculated End:", end);

      // Validate date format before API call
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start)) {
        console.error("❌ Invalid start date format:", start);
        throw new Error(
          `Invalid start date format: ${start}. Expected YYYY-MM-DD.`
        );
      }
      if (!dateRegex.test(end)) {
        console.error("❌ Invalid end date format:", end);
        throw new Error(
          `Invalid end date format: ${end}. Expected YYYY-MM-DD.`
        );
      }

      // Additional validation - check if dates are logical
      const startDate = new Date(start + "T00:00:00");
      const endDate = new Date(end + "T00:00:00");

      if (startDate > endDate) {
        console.error("❌ Start date is after end date");
        throw new Error("Start date cannot be after end date");
      }

      console.log("✅ Date validation passed");
      console.log("📊 Making API call with:", { start, end });

      // Make API call with proper error handling
      let response;
      try {
        response = await nutritionAPI.getRangeStatistics(start, end);
      } catch (apiError: any) {
        console.error("❌ API call failed:", apiError);
        console.error("- Error message:", apiError.message);
        console.error("- Error response:", apiError.response?.data);
        console.error("- Error status:", apiError.response?.status);

        // Provide more specific error messages
        if (apiError.response?.status === 400) {
          throw new Error(
            "Date format error. Please try selecting different dates."
          );
        } else if (apiError.response?.status === 404) {
          throw new Error(
            "Statistics endpoint not found. Please check your API configuration."
          );
        } else if (apiError.response?.status === 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error(
            `API Error: ${apiError.message || "Unknown error occurred"}`
          );
        }
      }

      console.log("📊 API Response:", response);

      if (response?.success && response?.data) {
        const d = response.data;

        // Map snake_case to camelCase
        setStatisticsData({
          averageAlcoholG: d.average_alcohol_g,
          averageCaffeineMg: d.average_caffeine_mg,
          averageCalories: d.average_calories,
          averageCarbsG: d.average_carbs_g,
          averageCholesterolMg: d.average_cholesterol_mg,
          averageConfidence: d.average_confidence,
          averageFatsG: d.average_fats_g,
          averageFiberG: d.average_fiber_g,
          averageGlycemicIndex: d.average_glycemic_index,
          averageInsolubleFiberG: d.average_insoluble_fiber_g,
          averageInsulinIndex: d.average_insulin_index,
          averageLiquidsMl: d.average_liquids_ml,
          averageMonounsaturatedFatsG: d.average_monounsaturated_fats_g,
          averageOmega3G: d.average_omega_3_g,
          averageOmega6G: d.average_omega_6_g,
          averagePolyunsaturatedFatsG: d.average_polyunsaturated_fats_g,
          averageProteinG: d.average_protein_g,
          averageSaturatedFatsG: d.average_saturated_fats_g,
          averageServingSizeG: d.average_serving_size_g,
          averageSodiumMg: d.average_sodium_mg,
          averageSolubleFiberG: d.average_soluble_fiber_g,
          averageSugarG: d.average_sugar_g,

          totalAlcoholG: d.total_alcohol_g,
          totalCaffeineMg: d.total_caffeine_mg,
          totalCalories: d.total_calories,
          totalCarbsG: d.total_carbs_g,
          totalCholesterolMg: d.total_cholesterol_mg,
          totalConfidence: d.total_confidence,
          totalFatsG: d.total_fats_g,
          totalFiberG: d.total_fiber_g,
          totalGlycemicIndex: d.total_glycemic_index,
          totalInsolubleFiberG: d.total_insoluble_fiber_g,
          totalInsulinIndex: d.total_insulin_index,
          totalLiquidsMl: d.total_liquids_ml,
          totalMonounsaturatedFatsG: d.total_monounsaturated_fats_g,
          totalOmega3G: d.total_omega_3_g,
          totalOmega6G: d.total_omega_6_g,
          totalPolyunsaturatedFatsG: d.total_polyunsaturated_fats_g,
          totalProteinG: d.total_protein_g,
          totalSaturatedFatsG: d.total_saturated_fats_g,
          totalServingSizeG: d.total_serving_size_g,
          totalSodiumMg: d.total_sodium_mg,
          totalSolubleFiberG: d.total_soluble_fiber_g,
          totalSugarG: d.total_sugar_g,

          totalDays: d.totalDays,
          totalMeals: d.totalMeals,

          dateRange: {
            startDate: d.dateRange.startDate,
            endDate: d.dateRange.endDate,
          },

          dailyBreakdown: d.dailyBreakdown, // optional, keep as is or type properly
        });

        console.log("✅ Statistics loaded successfully");
      } else {
        console.error("❌ API returned unsuccessful response:", response);
        throw new Error(response?.error || "Failed to load statistics data");
      }
    } catch (error: any) {
      console.error("❌ Statistics loading failed:", error);
      setError(error.message || "Unable to load statistics");

      // Show detailed error to user
      Alert.alert(
        t("common.error"),
        error.message || t("statistics.load_error"),
        [
          { text: t("common.ok"), style: "default" },
          {
            text: "Debug Info",
            style: "default",
            onPress: () => {
              const { start, end } = getDateRange();
              Alert.alert(
                "Debug Info",
                `Start: ${start}\nEnd: ${end}\nRange: ${activeTimeRange}`
              );
            },
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, t, activeTimeRange, customStartDate, customEndDate]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  }, [loadStatistics]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

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

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get health status color
  const getHealthStatusColor = (deviationRate: number): string => {
    if (deviationRate <= 10) return "#4CAF50"; // Green
    if (deviationRate <= 25) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };

  // Get health status text
  const getHealthStatusText = (deviationRate: number): string => {
    if (deviationRate <= 10) return t("statistics.excellent_health");
    if (deviationRate <= 25) return t("statistics.good_health");
    return t("statistics.needs_improvement");
  };

  // Stat Card Component
  const StatCard = React.memo(
    ({
      title,
      value,
      unit,
      icon,
      color = "#007AFF",
      isLarge = false,
    }: {
      title: string;
      value: number;
      unit: string;
      icon: string;
      color?: string;
      isLarge?: boolean;
    }) => (
      <View
        style={[
          styles.statCard,
          isLarge && styles.statCardLarge,
          isRTL && styles.statCardRTL,
        ]}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={isLarge ? 28 : 24} color="white" />
        </View>
        <View style={[styles.statInfo, isRTL && styles.statInfoRTL]}>
          <Text style={[styles.statTitle, isRTL && styles.textRTL]}>
            {title}
          </Text>
          <Text style={[styles.statValue, isRTL && styles.textRTL]}>
            {typeof value === "number" ? Math.round(value) : 0}
            <Text style={styles.statUnit}>{unit}</Text>
          </Text>
        </View>
      </View>
    )
  );

  // Time Range Button Component
  const TimeRangeButton = React.memo(
    ({
      type,
      isActive,
      onPress,
    }: {
      type: TimeRangeType;
      isActive: boolean;
      onPress: () => void;
    }) => (
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          isActive && styles.activeTimeRangeButton,
          isRTL && styles.timeRangeButtonRTL,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.timeRangeButtonText,
            isActive && styles.activeTimeRangeButtonText,
            isRTL && styles.textRTL,
          ]}
        >
          {t(`statistics.${type}`)}
        </Text>
      </TouchableOpacity>
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
          {t("statistics.title")}
        </Text>
        {/* Debug button for testing */}
        <TouchableOpacity
          style={styles.debugButton}
          onPress={testDateFormatting}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRangeContent}
        >
          {Object.values(TIME_RANGES).map((range) => (
            <TimeRangeButton
              key={range}
              type={range}
              isActive={activeTimeRange === range}
              onPress={() => setActiveTimeRange(range)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Custom Date Range Picker */}
      {activeTimeRange === TIME_RANGES.custom && (
        <View
          style={[
            styles.customDateContainer,
            isRTL && styles.customDateContainerRTL,
          ]}
        >
          <TouchableOpacity
            style={[styles.dateSelector, isRTL && styles.dateSelectorRTL]}
            onPress={() => openDatePicker("start")}
          >
            <Text style={[styles.dateLabel, isRTL && styles.textRTL]}>
              {t("statistics.start_date")}
            </Text>
            <Text style={[styles.dateValue, isRTL && styles.textRTL]}>
              {formatDisplayDate(customStartDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateSelector, isRTL && styles.dateSelectorRTL]}
            onPress={() => openDatePicker("end")}
          >
            <Text style={[styles.dateLabel, isRTL && styles.textRTL]}>
              {t("statistics.end_date")}
            </Text>
            <Text style={[styles.dateValue, isRTL && styles.textRTL]}>
              {formatDisplayDate(customEndDate)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, isRTL && styles.textRTL]}>
              {t("common.loading")}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={[styles.errorText, isRTL && styles.textRTL]}>
              {error}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadStatistics}
            >
              <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : statisticsData ? (
          <>
            {/* Nutrition Overview */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.nutrition_overview")}
              </Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title={t("statistics.calories")}
                  value={statisticsData.averageCalories}
                  unit=" kcal"
                  icon="flame"
                  color="#FF6B35"
                />
                <StatCard
                  title={t("statistics.protein")}
                  value={statisticsData.averageProteinG}
                  unit="g"
                  icon="fitness"
                  color="#4CAF50"
                />
                <StatCard
                  title={t("statistics.carbs")}
                  value={statisticsData.averageCarbsG}
                  unit="g"
                  icon="leaf"
                  color="#FF9800"
                />
                <StatCard
                  title={t("statistics.fat")}
                  value={statisticsData.averageFatsG}
                  unit="g"
                  icon="water"
                  color="#9C27B0"
                />
              </View>
            </View>

            {/* Additional Nutrients */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.additional_nutrients")}
              </Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title={t("statistics.fiber")}
                  value={statisticsData.averageFiberG}
                  unit="g"
                  icon="leaf-outline"
                  color="#8BC34A"
                />
                <StatCard
                  title={t("statistics.sugar")}
                  value={statisticsData.averageSugarG}
                  unit="g"
                  icon="ice-cream"
                  color="#E91E63"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.vitamins")}
              </Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title={t("statistics.fiber")}
                  value={statisticsData.averageOmega3G}
                  unit="g"
                  icon="leaf-outline"
                  color="#8BC34A"
                />
                <StatCard
                  title={t("statistics.sugar")}
                  value={statisticsData.totalOmega6G}
                  unit="g"
                  icon="ice-cream"
                  color="#E91E63"
                />
                <StatCard
                  title={t("statistics.sugar")}
                  value={statisticsData.averageOmega3G}
                  unit="g"
                  icon="ice-cream"
                  color="#E91E63"
                />
                <StatCard
                  title={t("statistics.sugar")}
                  value={statisticsData.averageOmega6G}
                  unit="g"
                  icon="ice-cream"
                  color="#E91E63"
                />
              </View>
            </View>

            {/* Beverages */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.beverages")}
              </Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title={t("statistics.water")}
                  value={statisticsData.averageLiquidsMl}
                  unit="ml"
                  icon="water"
                  color="#2196F3"
                />
                <StatCard
                  title={t("statistics.alcohol")}
                  value={statisticsData.averageAlcoholG}
                  unit="g"
                  icon="wine"
                  color="#F44336"
                />
                <StatCard
                  title={t("statistics.caffeine")}
                  value={statisticsData.averageCaffeineMg}
                  unit="mg"
                  icon="cafe"
                  color="#795548"
                />
              </View>
            </View>

            {/* Meal Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.meal_summary")}
              </Text>
              <StatCard
                title={t("statistics.total_meals")}
                value={statisticsData.totalMeals}
                unit=" meals"
                icon="restaurant"
                color="#607D8B"
                isLarge={true}
              />
            </View>
          </>
        ) : null}
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF6B35",
    borderRadius: 6,
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerRTL: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  timeRangeContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  timeRangeContent: {
    paddingHorizontal: 20,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    minWidth: 80,
    alignItems: "center",
  },
  timeRangeButtonRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  activeTimeRangeButton: {
    backgroundColor: "#007AFF",
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeTimeRangeButtonText: {
    color: "#fff",
  },
  customDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  customDateContainerRTL: {
    flexDirection: "row-reverse",
  },
  dateSelector: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateSelectorRTL: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
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
    color: "#F44336",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statCardLarge: {
    paddingVertical: 20,
  },
  statCardRTL: {
    flexDirection: "row-reverse",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statInfoRTL: {
    alignItems: "flex-end",
    marginRight: 16,
    marginLeft: 0,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  healthStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  healthIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  healthPercentage: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  healthDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  textRTL: {
    textAlign: "right",
  },
});
