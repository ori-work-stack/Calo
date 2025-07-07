import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "@/components/ui/IconSymbol";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  meal_timing: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  prep_time_minutes: number;
  allergens: string[];
}

interface MenuConfig {
  mealsPerDay: number;
  daysToGenerate: number;
  dietaryPreferences: string[];
  calorieTarget: number;
}

export default function RecommendedMenusScreen() {
  const [menus, setMenus] = useState<{ [key: string]: MenuItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<MenuConfig>({
    mealsPerDay: 3,
    daysToGenerate: 7,
    dietaryPreferences: [],
    calorieTarget: 2000,
  });

  useEffect(() => {
    loadRecommendedMenus();
  }, []);

  const loadRecommendedMenus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/api/meal-plans/recommended`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      } else {
        console.error("Failed to load recommended menus");
      }
    } catch (error) {
      console.error("Error loading recommended menus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewMenus = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/meal-plans/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        setMenus(data);
        Alert.alert("Success", "New menus generated successfully!");
      } else {
        Alert.alert("Error", "Failed to generate new menus");
      }
    } catch (error) {
      console.error("Error generating menus:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadRecommendedMenus();
    setIsRefreshing(false);
  };

  const getMealTimingColor = (timing: string) => {
    switch (timing) {
      case "BREAKFAST":
        return "#FF9500";
      case "LUNCH":
        return "#34C759";
      case "DINNER":
        return "#5856D6";
      case "SNACK":
        return "#FF2D92";
      default:
        return "#007AFF";
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <View key={item.id} style={styles.menuItem}>
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>{item.name}</Text>
        <View
          style={[
            styles.timingBadge,
            { backgroundColor: getMealTimingColor(item.meal_timing) },
          ]}
        >
          <Text style={styles.timingText}>{item.meal_timing}</Text>
        </View>
      </View>

      <Text style={styles.menuDescription}>{item.description}</Text>

      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Calories</Text>
          <Text style={styles.nutritionValue}>{item.calories}</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Protein</Text>
          <Text style={styles.nutritionValue}>{item.protein}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Carbs</Text>
          <Text style={styles.nutritionValue}>{item.carbs}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>Fat</Text>
          <Text style={styles.nutritionValue}>{item.fat}g</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <IconSymbol name="clock" size={16} color="#666" />
          <Text style={styles.metaText}>{item.prep_time_minutes} min</Text>
        </View>
        {item.allergens.length > 0 && (
          <View style={styles.metaItem}>
            <IconSymbol
              name="exclamationmark.triangle"
              size={16}
              color="#FF9500"
            />
            <Text style={styles.metaText}>{item.allergens.join(", ")}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading && Object.keys(menus).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recommended menus...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recommended Menus</Text>
        <Text style={styles.subtitle}>
          Personalized meal plans based on your preferences
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.configButton}
          onPress={() => setShowConfig(!showConfig)}
        >
          <IconSymbol name="gearshape" size={20} color="#007AFF" />
          <Text style={styles.configButtonText}>Configuration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.configButton, styles.primaryButton]}
          onPress={generateNewMenus}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <IconSymbol name="arrow.clockwise" size={20} color="white" />
              <Text style={[styles.configButtonText, styles.primaryButtonText]}>
                Generate New
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {showConfig && (
        <View style={styles.configSection}>
          <Text style={styles.configSectionTitle}>Menu Configuration</Text>
          <Text style={styles.configDescription}>
            Customize your meal plan preferences
          </Text>

          <View style={styles.configOption}>
            <Text style={styles.configLabel}>Meals per day</Text>
            <View style={styles.configButtons}>
              {[2, 3, 4, 5].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.configButton,
                    config.mealsPerDay === count && styles.configButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, mealsPerDay: count })}
                >
                  <Text
                    style={[
                      styles.configButtonText,
                      config.mealsPerDay === count &&
                        styles.configButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configOption}>
            <Text style={styles.configLabel}>Days to generate</Text>
            <View style={styles.configButtons}>
              {[3, 7, 14].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.configButton,
                    config.daysToGenerate === days && styles.configButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, daysToGenerate: days })}
                >
                  <Text
                    style={[
                      styles.configButtonText,
                      config.daysToGenerate === days &&
                        styles.configButtonTextActive,
                    ]}
                  >
                    {days}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.configOption}>
            <Text style={styles.configLabel}>Daily calorie target</Text>
            <View style={styles.configButtons}>
              {[1500, 2000, 2500, 3000].map((calories) => (
                <TouchableOpacity
                  key={calories}
                  style={[
                    styles.configButton,
                    config.calorieTarget === calories &&
                      styles.configButtonActive,
                  ]}
                  onPress={() =>
                    setConfig({ ...config, calorieTarget: calories })
                  }
                >
                  <Text
                    style={[
                      styles.configButtonText,
                      config.calorieTarget === calories &&
                        styles.configButtonTextActive,
                    ]}
                  >
                    {calories}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        {Object.keys(menus).length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No menus available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Generate your first personalized meal plan
            </Text>
          </View>
        ) : (
          Object.entries(menus).map(([day, dayMenus]) => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>
              {dayMenus.map((item) => renderMenuItem(item))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  configButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  configButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    color: "white",
  },
  configSection: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  configSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  configDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  configOption: {
    marginBottom: 25,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  configButtons: {
    flexDirection: "row",
    gap: 10,
  },
  configButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  configButtonTextActive: {
    color: "white",
  },
  menuSection: {
    padding: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  daySection: {
    marginBottom: 25,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  menuItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  timingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
});
