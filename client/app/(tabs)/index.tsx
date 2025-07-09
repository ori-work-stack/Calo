import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import { fetchMeals } from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import FloatingChatButton from "../../components/FloatingChatButton";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { user } = useSelector((state: RootState) => state.auth);
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  useEffect(() => {
    if (meals) {
      const sortedMeals = [...meals].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentMeals(sortedMeals.slice(0, 3));
    }
  }, [meals]);

  const QuickActionButton = ({
    icon,
    title,
    onPress,
    color = "#007AFF",
  }: {
    icon: any;
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.quickActionButton,
        { borderColor: color },
        isRTL && { flexDirection: "column-reverse" },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcomeText, isRTL && { textAlign: "right" }]}>
            {t("home.welcome")}
            {user?.name ? `, ${user.name}` : ""}!
          </Text>
          <Text style={[styles.dateText, isRTL && { textAlign: "right" }]}>
            {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.quick_actions")}</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              icon="camera"
              title={t("home.scan_meal")}
              onPress={() => router.push("/(tabs)/camera")}
              color="#4CAF50"
            />
            <QuickActionButton
              icon="add-circle"
              title={t("home.add_meal")}
              onPress={() => router.push("/(tabs)/meals")}
              color="#FF9800"
            />
            <QuickActionButton
              icon="stats-chart"
              title={t("home.view_statistics")}
              onPress={() => router.push("/(tabs)/statistics")}
              color="#9C27B0"
            />
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <View
            style={[
              styles.sectionHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text style={styles.sectionTitle}>{t("home.recent_meals")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/meals")}>
              <Text style={styles.viewAllText}>{t("common.view_all")}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={styles.loader}
            />
          ) : recentMeals.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mealsScroll}
            >
              {recentMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.meal_id}
                  style={styles.mealCard}
                  onPress={() =>
                    console.log("Navigate to meal details", meal.meal_id)
                  }
                >
                  {meal.image_url && (
                    <Image
                      source={{ uri: meal.image_url }}
                      style={styles.mealImage}
                    />
                  )}
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={1}>
                      {meal.name}
                    </Text>
                    <Text style={styles.mealCalories}>
                      {meal.calories} {t("meals.calories")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>{t("meals.no_meals")}</Text>
              <Text style={styles.emptySubtext}>
                {t("home.add_meal_hint", {
                  defaultValue: "Start by scanning or adding a meal",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Daily Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.daily_goals")}</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {recentMeals.reduce(
                  (sum, meal) => sum + (meal.calories || 0),
                  0
                )}
              </Text>
              <Text style={styles.overviewLabel}>{t("meals.calories")}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {Math.round(
                  recentMeals.reduce(
                    (sum, meal) => sum + (meal.protein || 0),
                    0
                  )
                )}
                g
              </Text>
              <Text style={styles.overviewLabel}>{t("meals.protein")}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {Math.round(
                  recentMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
                )}
                g
              </Text>
              <Text style={styles.overviewLabel}>{t("meals.carbs")}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {Math.round(
                  recentMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0)
                )}
                g
              </Text>
              <Text style={styles.overviewLabel}>{t("meals.fat")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <FloatingChatButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  dateText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllText: {
    fontSize: 16,
    color: "#007AFF",
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickActionButton: {
    alignItems: "center",
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
  },
  mealsScroll: {
    marginBottom: 16,
  },
  mealCard: {
    width: Dimensions.get("window").width / 3,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  mealImage: {
    width: "100%",
    height: 80,
  },
  mealInfo: {
    padding: 8,
  },
  mealName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  overviewCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
  },
  overviewItem: {
    alignItems: "center",
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  overviewLabel: {
    fontSize: 14,
    color: "#666",
  },
  loader: {
    marginTop: 20,
  },
});
