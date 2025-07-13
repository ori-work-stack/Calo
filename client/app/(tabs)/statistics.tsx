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
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

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

  dailyBreakdown?: Array<{
    date: string;
    calories: number;
    fats_g: number;
    sugar_g: number;
    protein_g: number;
    carbs_g: number;
    fiber_g: number;
    sodium_mg: number;
  }>;
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
  const [selectedChart, setSelectedChart] = useState<"line" | "bar">("line");

  // Helper function to format date as YYYY-MM-DD with extensive validation
  const formatDateString = useCallback((date: Date): string => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      console.log("📅 Final formatted date:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Complete date formatting failure:", error);
      return new Date().toISOString().split("T")[0];
    }
  }, []);

  // Get date range based on selected time range
  const getDateRange = useCallback((): DateRange => {
    try {
      const now = new Date();
      const today = formatDateString(now);

      switch (activeTimeRange) {
        case TIME_RANGES.today:
          return { start: today, end: today };
        case TIME_RANGES.week:
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6);
          return { start: formatDateString(weekStart), end: today };
        case TIME_RANGES.month:
          const monthStart = new Date(now);
          monthStart.setDate(now.getDate() - 29);
          return { start: formatDateString(monthStart), end: today };
        case TIME_RANGES.custom:
          return {
            start: formatDateString(customStartDate),
            end: formatDateString(customEndDate),
          };
        default:
          return { start: today, end: today };
      }
    } catch (error) {
      console.error("Error in getDateRange:", error);
      const fallbackDate = new Date().toISOString().split("T")[0];
      return { start: fallbackDate, end: fallbackDate };
    }
  }, [activeTimeRange, customStartDate, customEndDate, formatDateString]);

  // Load statistics data
  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(start) || !dateRegex.test(end)) {
        throw new Error("Invalid date format");
      }

      const startDate = new Date(start + "T00:00:00");
      const endDate = new Date(end + "T00:00:00");

      if (startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      const response = await nutritionAPI.getRangeStatistics(start, end);

      if (response?.success && response?.data) {
        const d = response.data;
        setStatisticsData({
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

          totalDays: d.totalDays || 0,
          totalMeals: d.totalMeals || 0,

          dateRange: {
            startDate: d.dateRange?.startDate || start,
            endDate: d.dateRange?.endDate || end,
          },

          dailyBreakdown: d.dailyBreakdown || [],
        });
      } else {
        throw new Error(response?.error || "Failed to load statistics data");
      }
    } catch (error: any) {
      console.error("❌ Statistics loading failed:", error);
      setError(error.message || "Unable to load statistics");
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

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

  // Chart configuration
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#007AFF",
    },
  };

  // Calculate chart width dynamically
  const getChartWidth = () => {
    return Math.max(280, width - 80);
  };

  // Prepare chart data
  const prepareChartData = (nutrient: string) => {
    console.log(nutrient);
    if (
      !statisticsData?.dailyBreakdown ||
      statisticsData.dailyBreakdown.length === 0
    ) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      };
    }

    const breakdown = statisticsData.dailyBreakdown;

    // Sort by date to ensure proper chronological order
    const sortedBreakdown = [...breakdown].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedBreakdown.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const data = sortedBreakdown.map((item) => {
      let value = 0;
      switch (nutrient) {
        case "calories":
          value = Number(item.calories) || 0;
          break;
        case "fats":
          value = Number(item.fats_g) || 0;
          break;
        case "sugar":
          value = Number(item.sugar_g) || 0;
          break;
        case "protein":
          value = Number(item.protein_g) || 0;
          break;
        case "carbs":
          value = Number(item.carbs_g) || 0;
          break;
        case "fiber":
          value = Number(item.fiber_g) || 0;
          break;
        case "sodium":
          value = Number(item.sodium_mg) || 0;
          break;
        default:
          value = 0;
      }
      return Math.round(value * 100) / 100; // Round to 2 decimal places
    });

    // Ensure we have at least one data point
    if (data.length === 0 || data.every((val) => val === 0)) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      };
    }

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  // Prepare pie chart data
  const preparePieChartData = () => {
    if (!statisticsData) {
      return [];
    }

    const pieData = [
      {
        name: "Protein",
        population: statisticsData.averageProteinG || 0,
        color: "#4CAF50",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
      {
        name: "Carbs",
        population: statisticsData.averageCarbsG || 0,
        color: "#FF9800",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
      {
        name: "Fats",
        population: statisticsData.averageFatsG || 0,
        color: "#9C27B0",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
      {
        name: "Fiber",
        population: statisticsData.averageFiberG || 0,
        color: "#8BC34A",
        legendFontColor: "#333",
        legendFontSize: 12,
      },
    ];

    return pieData.filter((item) => item.population > 0);
  };

  const renderChart = (data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: data.map((_, index) => `Day ${index + 1}`),
      datasets: [
        {
          data: data.map((item) => item?.value || 0),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={width - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
      />
    );
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

  // Additional Statistics Component
  const AdditionalStats = React.memo(() => {
    if (!statisticsData) return null;

    const additionalStats = [
      {
        key: "cholesterol",
        value: statisticsData.averageCholesterolMg,
        unit: "mg",
        icon: "heart",
      },
      {
        key: "glycemic_index",
        value: statisticsData.averageGlycemicIndex,
        unit: "",
        icon: "pulse",
      },
      {
        key: "insulin_index",
        value: statisticsData.averageInsulinIndex,
        unit: "",
        icon: "medical",
      },
      {
        key: "omega_3",
        value: statisticsData.averageOmega3G,
        unit: "g",
        icon: "fish",
      },
      {
        key: "omega_6",
        value: statisticsData.averageOmega6G,
        unit: "g",
        icon: "fish",
      },
      {
        key: "saturated_fats",
        value: statisticsData.averageSaturatedFatsG,
        unit: "g",
        icon: "warning",
      },
      {
        key: "monounsaturated_fats",
        value: statisticsData.averageMonounsaturatedFatsG,
        unit: "g",
        icon: "leaf",
      },
      {
        key: "polyunsaturated_fats",
        value: statisticsData.averagePolyunsaturatedFatsG,
        unit: "g",
        icon: "leaf",
      },
      {
        key: "soluble_fiber",
        value: statisticsData.averageSolubleFiberG,
        unit: "g",
        icon: "leaf-outline",
      },
      {
        key: "insoluble_fiber",
        value: statisticsData.averageInsolubleFiberG,
        unit: "g",
        icon: "leaf-outline",
      },
      {
        key: "confidence",
        value: statisticsData.averageConfidence,
        unit: "%",
        icon: "checkmark-circle",
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
          {t("statistics.additional_metrics")}
        </Text>
        <View style={styles.statsGrid}>
          {additionalStats.map((stat, index) => (
            <StatCard
              key={index}
              title={t(`statistics.${stat.key}`)}
              value={stat.value}
              unit={stat.unit}
              icon={stat.icon}
              color="#607D8B"
            />
          ))}
        </View>
      </View>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>
          {t("statistics.title")}
        </Text>
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
            {/* Chart Section */}
            {statisticsData.dailyBreakdown &&
              statisticsData.dailyBreakdown.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                    {t("statistics.daily_trends")}
                  </Text>

                  {/* Chart Type Toggle */}
                  <View style={styles.chartToggle}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        selectedChart === "line" && styles.activeToggleButton,
                      ]}
                      onPress={() => setSelectedChart("line")}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedChart === "line" &&
                            styles.activeToggleButtonText,
                        ]}
                      >
                        {t("statistics.line_chart")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        selectedChart === "bar" && styles.activeToggleButton,
                      ]}
                      onPress={() => setSelectedChart("bar")}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          selectedChart === "bar" &&
                            styles.activeToggleButtonText,
                        ]}
                      >
                        {t("statistics.bar_chart")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Calories Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.calories")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("calories")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("calories")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Fats Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.fats")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("fats")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("fats")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Sugar Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.sugar")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("sugar")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("sugar")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Protein Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.protein")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("protein")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("protein")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Carbs Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.carbs")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("carbs")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("carbs")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Fiber Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.fiber")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("fiber")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("fiber")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>

                  {/* Sodium Chart */}
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>
                      {t("statistics.sodium")}
                    </Text>
                    <View style={styles.chartWrapper}>
                      {selectedChart === "line" ? (
                        <LineChart
                          data={prepareChartData("sodium")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          bezier
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          withDots={true}
                          withShadow={false}
                        />
                      ) : (
                        <BarChart
                          data={prepareChartData("sodium")}
                          width={getChartWidth()}
                          height={220}
                          chartConfig={chartConfig}
                          style={styles.chart}
                          withHorizontalLabels={true}
                          withVerticalLabels={true}
                          showValuesOnTopOfBars={true}
                          yAxisLabel={""}
                          yAxisSuffix={""}
                        />
                      )}
                    </View>
                  </View>
                </View>
              )}

            {/* Pie Chart Section */}
            {preparePieChartData().length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                  {t("statistics.macronutrient_distribution")}
                </Text>
                <View style={styles.pieChartWrapper}>
                  <PieChart
                    data={preparePieChartData()}
                    width={getChartWidth()}
                    chartConfig={chartConfig}
                    height={250} // Increased height to prevent cutting
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="32" // Slightly more padding for balance
                    center={[0, 0]} // Centered correctly
                    absolute
                    hasLegend={true}
                  />
                </View>
              </View>
            )}

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
                <StatCard
                  title={t("statistics.sodium")}
                  value={statisticsData.averageSodiumMg}
                  unit="mg"
                  icon="warning"
                  color="#F44336"
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

            {/* Additional Statistics */}
            <AdditionalStats />

            {/* Meal Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
                {t("statistics.meal_summary")}
              </Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title={t("statistics.total_meals")}
                  value={statisticsData.totalMeals}
                  unit=" meals"
                  icon="restaurant"
                  color="#607D8B"
                />
                <StatCard
                  title={t("statistics.total_days")}
                  value={statisticsData.totalDays}
                  unit=" days"
                  icon="calendar"
                  color="#607D8B"
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyText, isRTL && styles.textRTL]}>
              {t("statistics.no_data")}
            </Text>
          </View>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
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
  chartToggle: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: "#007AFF",
  },
  toggleButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeToggleButtonText: {
    color: "#fff",
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  pieChartWrapper: {
    alignItems: "center", // Horizontally center the chart
    justifyContent: "center", // Vertically center if needed
    paddingVertical: 10,
    backgroundColor: "transparent",
    overflow: "visible", // Ensure it’s not clipping
  },
  textRTL: {
    textAlign: "right",
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
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});
