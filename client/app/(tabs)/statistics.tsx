import { statisticsAPI } from "@/src/services/api";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width: screenWidth } = Dimensions.get("window");

interface NutritionStatistics {
  average_calories_daily: number;
  calorie_goal_achievement_percent: number;
  average_protein_daily: number;
  average_carbs_daily: number;
  average_fats_daily: number;
  average_fiber_daily: number;
  average_sodium_daily: number;
  average_sugar_daily: number;
  average_fluids_daily: number;
  processed_food_percentage: number;
  alcohol_caffeine_intake: number;
  vegetable_fruit_intake: number;
  full_logging_percentage: number;
  allergen_alerts: string[];
  health_risk_percentage: number;
  average_eating_hours: { start: string; end: string };
  intermittent_fasting_hours: number;
  missed_meals_alert: number;
  nutrition_score: number;
  weekly_trends: {
    calories: number[];
    protein: number[];
    carbs: number[];
    fats: number[];
  };
  insights: string[];
  recommendations: string[];
}

export default function StatisticsScreen() {
  const [statistics, setStatistics] = useState<NutritionStatistics | null>(
    null
  );
  const [period, setPeriod] = useState<"week" | "month" | "custom">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await statisticsAPI.getStatistics(period);
      console.log("Statistics loaded successfully:", data);
      setStatistics(data);
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "שגיאה בטעינת הסטטיסטיקות"
      );
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#007bff",
    },
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>טוען סטטיסטיקות...</Text>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>לא נמצאו נתונים</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
          <Text style={styles.retryButtonText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const macroData = [
    {
      name: "חלבון",
      population: Math.max(1, statistics.average_protein_daily || 0),
      color: "#FF6B6B",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "פחמימות",
      population: Math.max(1, statistics.average_carbs_daily || 0),
      color: "#4ECDC4",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "שומנים",
      population: Math.max(1, statistics.average_fats_daily || 0),
      color: "#45B7D1",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ];

  const weeklyCaloriesData = {
    labels: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    datasets: [
      {
        data:
          statistics.weekly_trends.calories.length > 0
            ? statistics.weekly_trends.calories.map((cal) => cal || 0)
            : [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  const nutrition_scoreData = {
    labels: ["ציון תזונה"],
    datasets: [
      {
        data: [statistics.nutrition_score, 100 - statistics.nutrition_score],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>סטטיסטיקות תזונה ובריאות</Text>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(["week", "month", "custom"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {p === "week" ? "שבוע" : p === "month" ? "חודש" : "מותאם"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nutrition Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ציון תזונה כללי</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{statistics.nutrition_score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreProgress,
              { width: `${statistics.nutrition_score}%` },
            ]}
          />
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>מדדים מרכזיים</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.average_calories_daily}
            </Text>
            <Text style={styles.metricLabel}>קלוריות יומי ממוצע</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.calorie_goal_achievement_percent}%
            </Text>
            <Text style={styles.metricLabel}>עמידה ביעד קלורי</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.processed_food_percentage}%
            </Text>
            <Text style={styles.metricLabel}>מזון מעובד</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.full_logging_percentage}%
            </Text>
            <Text style={styles.metricLabel}>תיעוד מלא</Text>
          </View>
        </View>
      </View>

      {/* Macro Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          התפלגות מקרו נוטריינטים (גרם יומי ממוצע)
        </Text>
        <PieChart
          data={macroData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Weekly Trends */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>מגמת קלוריות שבועית</Text>
        <LineChart
          data={weeklyCaloriesData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Detailed Nutrition */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>נתונים תזונתיים מפורטים</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>סיבים תזונתיים</Text>
            <Text style={styles.detailValue}>
              {statistics.average_fiber_daily}g
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>נתרן</Text>
            <Text style={styles.detailValue}>
              {statistics.average_sodium_daily}mg
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>סוכר</Text>
            <Text style={styles.detailValue}>
              {statistics.average_sugar_daily}g
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ירקות ופירות</Text>
            <Text style={styles.detailValue}>
              {statistics.vegetable_fruit_intake}%
            </Text>
          </View>
        </View>
      </View>

      {/* Eating Patterns */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>דפוסי אכילה</Text>
        <View style={styles.patternsContainer}>
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>שעות אכילה</Text>
            <Text style={styles.patternValue}>
              {statistics.average_eating_hours.start} -{" "}
              {statistics.average_eating_hours.end}
            </Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>צום לסירוגין</Text>
            <Text style={styles.patternValue}>
              {statistics.intermittent_fasting_hours} שעות
            </Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>ארוחות חסרות השבוע</Text>
            <Text style={styles.patternValue}>
              {statistics.missed_meals_alert}
            </Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      {statistics.insights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>תובנות אישיות</Text>
          {statistics.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightText}>• {insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {statistics.recommendations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>המלצות</Text>
          {statistics.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>💡 {recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alerts */}
      {statistics.allergen_alerts.length > 0 && (
        <View style={[styles.card, styles.alertCard]}>
          <Text style={styles.cardTitle}>התראות אלרגנים</Text>
          {statistics.allergen_alerts.map((allergen, index) => (
            <View key={index} style={styles.alertItem}>
              <Text style={styles.alertText}>⚠️ {allergen}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
  },
  periodButtonActive: {
    backgroundColor: "#007bff",
  },
  periodButtonText: {
    color: "#6c757d",
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  card: {
    margin: 15,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#28a745",
  },
  scoreMax: {
    fontSize: 24,
    color: "#6c757d",
    marginLeft: 5,
  },
  scoreBar: {
    height: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 5,
    overflow: "hidden",
  },
  scoreProgress: {
    height: "100%",
    backgroundColor: "#28a745",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metric: {
    width: "48%",
    marginBottom: 15,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  patternsContainer: {
    gap: 15,
  },
  patternItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patternLabel: {
    fontSize: 16,
    color: "#6c757d",
  },
  patternValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  insightItem: {
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  recommendationItem: {
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  alertItem: {
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#856404",
  },
  bottomSpace: {
    height: 20,
  },
});
