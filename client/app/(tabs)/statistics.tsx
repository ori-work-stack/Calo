import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { nutritionAPI, statisticsAPI } from "@/src/services/api";

interface StatisticsData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  water_ml: number;
  alcohol_g: number;
  caffeine_mg: number;
  meal_count: number;
  health_deviation_rate: number;
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [timeRange, setTimeRange] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >("weekly");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [toDate, setToDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<"from" | "to">("from");
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [timeRange, fromDate, toDate]);

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;
      const now = new Date();

      switch (timeRange) {
        case "daily":
          startDate = formatDateForAPI(now);
          endDate = startDate;
          break;
        case "weekly":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = formatDateForAPI(weekAgo);
          endDate = formatDateForAPI(now);
          break;
        case "monthly":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = formatDateForAPI(monthAgo);
          endDate = formatDateForAPI(now);
          break;
        case "custom":
          startDate = formatDateForAPI(fromDate);
          endDate = formatDateForAPI(toDate);
          break;
      }

      console.log("📅 Formatted dates for API:", { startDate, endDate });

      const response = await nutritionAPI.getRangeStatistics(
        startDate,
        endDate
      );

      if (response.success) {
        setStatistics(response.data);
      } else {
        throw new Error(response.error || "Failed to load statistics");
      }
    } catch (error: any) {
      console.error("Failed to load statistics:", error);
      Alert.alert("Error", error.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = (mode: "from" | "to") => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === "from") {
        setFromDate(selectedDate);
      } else {
        setToDate(selectedDate);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isRTL ? "he-IL" : "en-US");
  };

  const getHealthDeviationColor = (rate: number) => {
    if (rate <= 10) return "#4CAF50"; // Green - Good
    if (rate <= 25) return "#FF9800"; // Orange - Moderate
    return "#F44336"; // Red - High deviation
  };

  const StatCard = ({
    title,
    value,
    unit,
    icon,
    color = "#007AFF",
  }: {
    title: string;
    value: number;
    unit: string;
    icon: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, isRTL && styles.statCardRTL]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <View style={[styles.statContent, isRTL && styles.statContentRTL]}>
        <Text style={[styles.statTitle, isRTL && styles.statTitleRTL]}>
          {title}
        </Text>
        <Text style={[styles.statValue, isRTL && styles.statValueRTL]}>
          {Math.round(value)}
          {unit}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {t("statistics.title")}
        </Text>
      </View>

      {/* Time Range Selector */}
      <View
        style={[
          styles.timeRangeContainer,
          isRTL && styles.timeRangeContainerRTL,
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeRangeScroll}
        >
          {["daily", "weekly", "monthly", "custom"].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.activeTimeRangeButton,
                isRTL && styles.timeRangeButtonRTL,
              ]}
              onPress={() => setTimeRange(range as any)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  timeRange === range && styles.activeTimeRangeButtonText,
                  isRTL && styles.timeRangeButtonTextRTL,
                ]}
              >
                {t(
                  `statistics.${
                    range === "daily"
                      ? "daily_average"
                      : range === "weekly"
                      ? "weekly_overview"
                      : range === "monthly"
                      ? "monthly_overview"
                      : "custom_date_range"
                  }`
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Date Range */}
      {timeRange === "custom" && (
        <View
          style={[
            styles.customDateContainer,
            isRTL && styles.customDateContainerRTL,
          ]}
        >
          <TouchableOpacity
            style={[styles.dateButton, isRTL && styles.dateButtonRTL]}
            onPress={() => openDatePicker("from")}
          >
            <Text style={[styles.dateLabel, isRTL && styles.dateLabelRTL]}>
              {t("statistics.from")}
            </Text>
            <Text style={[styles.dateValue, isRTL && styles.dateValueRTL]}>
              {formatDate(fromDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateButton, isRTL && styles.dateButtonRTL]}
            onPress={() => openDatePicker("to")}
          >
            <Text style={[styles.dateLabel, isRTL && styles.dateLabelRTL]}>
              {t("statistics.to")}
            </Text>
            <Text style={[styles.dateValue, isRTL && styles.dateValueRTL]}>
              {formatDate(toDate)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {statistics && (
            <>
              {/* Nutrition Stats */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
                >
                  {t("statistics.nutrition_stats")}
                </Text>
                <View style={styles.statsGrid}>
                  <StatCard
                    title={t("statistics.calories_consumed")}
                    value={statistics.calories}
                    unit=""
                    icon="flame"
                    color="#FF6B35"
                  />
                  <StatCard
                    title={t("statistics.protein_intake")}
                    value={statistics.protein}
                    unit="g"
                    icon="fitness"
                    color="#4CAF50"
                  />
                  <StatCard
                    title={t("statistics.carbs_intake")}
                    value={statistics.carbs}
                    unit="g"
                    icon="leaf"
                    color="#FF9800"
                  />
                  <StatCard
                    title={t("statistics.fat_intake")}
                    value={statistics.fat}
                    unit="g"
                    icon="water"
                    color="#9C27B0"
                  />
                </View>
              </View>

              {/* Hydration & Substances */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
                >
                  {t("statistics.water_intake")} &{" "}
                  {t("statistics.alcohol_consumption")}
                </Text>
                <View style={styles.statsGrid}>
                  <StatCard
                    title={t("statistics.water_intake")}
                    value={statistics.water_ml}
                    unit="ml"
                    icon="water"
                    color="#2196F3"
                  />
                  <StatCard
                    title={t("statistics.alcohol_consumption")}
                    value={statistics.alcohol_g}
                    unit="g"
                    icon="wine"
                    color="#F44336"
                  />
                  <StatCard
                    title={t("statistics.caffeine_consumption")}
                    value={statistics.caffeine_mg}
                    unit="mg"
                    icon="cafe"
                    color="#795548"
                  />
                </View>
              </View>

              {/* Health Deviation Rate */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
                >
                  {t("statistics.health_deviation_rate")}
                </Text>
                <View
                  style={[
                    styles.deviationCard,
                    isRTL && styles.deviationCardRTL,
                  ]}
                >
                  <View
                    style={[
                      styles.deviationIndicator,
                      {
                        backgroundColor: getHealthDeviationColor(
                          statistics.health_deviation_rate
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.deviationValue}>
                      {Math.round(statistics.health_deviation_rate)}%
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.deviationText,
                      isRTL && styles.deviationTextRTL,
                    ]}
                  >
                    {statistics.health_deviation_rate <= 10
                      ? "Excellent adherence to health goals"
                      : statistics.health_deviation_rate <= 25
                      ? "Good adherence with minor deviations"
                      : "Consider adjusting your nutrition plan"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === "from" ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerRTL: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  headerTitleRTL: {
    textAlign: "right",
  },
  timeRangeContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  timeRangeContainerRTL: {
    // RTL specific styles
  },
  timeRangeScroll: {
    paddingHorizontal: 20,
  },
  timeRangeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  timeRangeButtonRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  activeTimeRangeButton: {
    backgroundColor: "#007AFF",
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timeRangeButtonTextRTL: {
    textAlign: "right",
  },
  activeTimeRangeButtonText: {
    color: "#fff",
  },
  customDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  customDateContainerRTL: {
    flexDirection: "row-reverse",
  },
  dateButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  dateButtonRTL: {
    // RTL specific styles
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateLabelRTL: {
    textAlign: "right",
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dateValueRTL: {
    textAlign: "right",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  section: {
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  sectionTitleRTL: {
    textAlign: "right",
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
  },
  statCardRTL: {
    flexDirection: "row-reverse",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  statContent: {
    flex: 1,
  },
  statContentRTL: {
    alignItems: "flex-end",
    marginRight: 15,
    marginLeft: 0,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statTitleRTL: {
    textAlign: "right",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statValueRTL: {
    textAlign: "right",
  },
  deviationCard: {
    alignItems: "center",
    padding: 20,
  },
  deviationCardRTL: {
    // RTL specific styles
  },
  deviationIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  deviationValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  deviationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  deviationTextRTL: {
    textAlign: "right",
  },
});
