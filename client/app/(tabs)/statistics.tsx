import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width: screenWidth } = Dimensions.get("window");

interface NutritionStatistics {
  averageCaloriesDaily: number;
  calorieGoalAchievementPercent: number;
  averageProteinDaily: number;
  averageCarbsDaily: number;
  averageFatsDaily: number;
  averageFiberDaily: number;
  averageSodiumDaily: number;
  averageSugarDaily: number;
  averageFluidsDaily: number;
  processedFoodPercentage: number;
  alcoholCaffeineIntake: number;
  vegetableFruitIntake: number;
  fullLoggingPercentage: number;
  allergenAlerts: string[];
  healthRiskPercentage: number;
  averageEatingHours: { start: string; end: string };
  intermittentFastingHours: number;
  missedMealsAlert: number;
  nutritionScore: number;
  weeklyTrends: {
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
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      // Use your existing API service with proper authentication handling
      const axios = (await import("axios")).default;

      // Create API instance with same configuration as your api.ts
      const getApiBaseUrl = () => {
        if (Platform.OS === "web") {
          return "http://localhost:5000/api";
        } else {
          return API_URL;
        }
      };

      const apiInstance = axios.create({
        baseURL: getApiBaseUrl(),
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: Platform.OS === "web",
      });

      // Add authentication for mobile
      if (Platform.OS !== "web") {
        const { authAPI } = await import("../../src/services/api");
        const token = await authAPI.getStoredToken();
        if (token) {
          apiInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;
        }
      }

      const response = await apiInstance.get(`/statistics?period=${period}`);

      console.log("Statistics loaded successfully:", response.data);
      setStatistics(response.data);
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      Alert.alert(
        "שגיאה",
        error.response?.data?.message ||
          error.message ||
          "לא הצלחנו לטעון את הסטטיסטיקות"
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
      population: Math.max(1, statistics.averageProteinDaily || 0),
      color: "#FF6B6B",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "פחמימות",
      population: Math.max(1, statistics.averageCarbsDaily || 0),
      color: "#4ECDC4",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "שומנים",
      population: Math.max(1, statistics.averageFatsDaily || 0),
      color: "#45B7D1",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ];

  const weeklyCaloriesData = {
    labels: ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"],
    datasets: [
      {
        data:
          statistics.weeklyTrends.calories.length > 0
            ? statistics.weeklyTrends.calories.map((cal) => cal || 0)
            : [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  };

  const nutritionScoreData = {
    labels: ["ציון תזונה"],
    datasets: [
      {
        data: [statistics.nutritionScore, 100 - statistics.nutritionScore],
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
          <Text style={styles.scoreValue}>{statistics.nutritionScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreProgress,
              { width: `${statistics.nutritionScore}%` },
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
              {statistics.averageCaloriesDaily}
            </Text>
            <Text style={styles.metricLabel}>קלוריות יומי ממוצע</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.calorieGoalAchievementPercent}%
            </Text>
            <Text style={styles.metricLabel}>עמידה ביעד קלורי</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.processedFoodPercentage}%
            </Text>
            <Text style={styles.metricLabel}>מזון מעובד</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {statistics.fullLoggingPercentage}%
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
              {statistics.averageFiberDaily}g
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>נתרן</Text>
            <Text style={styles.detailValue}>
              {statistics.averageSodiumDaily}mg
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>סוכר</Text>
            <Text style={styles.detailValue}>
              {statistics.averageSugarDaily}g
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ירקות ופירות</Text>
            <Text style={styles.detailValue}>
              {statistics.vegetableFruitIntake}%
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
              {statistics.averageEatingHours.start} -{" "}
              {statistics.averageEatingHours.end}
            </Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>צום לסירוגין</Text>
            <Text style={styles.patternValue}>
              {statistics.intermittentFastingHours} שעות
            </Text>
          </View>
          <View style={styles.patternItem}>
            <Text style={styles.patternLabel}>ארוחות חסרות השבוע</Text>
            <Text style={styles.patternValue}>
              {statistics.missedMealsAlert}
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
      {statistics.allergenAlerts.length > 0 && (
        <View style={[styles.card, styles.alertCard]}>
          <Text style={styles.cardTitle}>התראות אלרגנים</Text>
          {statistics.allergenAlerts.map((allergen, index) => (
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
