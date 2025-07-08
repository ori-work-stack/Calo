import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/services/api";

interface Ingredient {
  ingredient_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  meal_id: string;
  name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
}

interface RecommendedMenu {
  menu_id: string;
  title: string;
  description: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  meals: Meal[];
}

export default function RecommendedMenusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: menusData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendedMenus"],
    queryFn: async () => {
      const response = await api.get("/meal-plans/recommended");
      return response.data;
    },
  });

  const generateMenuMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/meal-plans/recommended/generate");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendedMenus"] });
      Alert.alert("Success", "New personalized menu generated!");
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to generate menu"
      );
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.mealType}>{item.meal_type}</Text>
      <View style={styles.nutritionRow}>
        <Text style={styles.nutritionText}>🔥 {item.calories} cal</Text>
        <Text style={styles.nutritionText}>🥩 {item.protein}g protein</Text>
        <Text style={styles.nutritionText}>🍞 {item.carbs}g carbs</Text>
        <Text style={styles.nutritionText}>🥑 {item.fat}g fat</Text>
      </View>
    </View>
  );

  const renderMenu = ({ item }: { item: RecommendedMenu }) => (
    <View style={styles.menuCard}>
      <Text style={styles.menuTitle}>{item.title}</Text>
      <Text style={styles.menuDescription}>{item.description}</Text>
      <View style={styles.totalNutrition}>
        <Text style={styles.totalText}>
          Total: {item.total_calories} calories
        </Text>
        <Text style={styles.totalText}>
          P: {item.total_protein}g | C: {item.total_carbs}g | F:{" "}
          {item.total_fat}g
        </Text>
      </View>
      <Text style={styles.mealsHeader}>Meals:</Text>
      {item.meals.map((meal) => (
        <View key={meal.meal_id}>{renderMeal({ item: meal })}</View>
      ))}
      <Text style={styles.dateText}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading recommended menus...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load menus</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menus = menusData?.menus || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended Menus</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => generateMenuMutation.mutate()}
          disabled={generateMenuMutation.isPending}
        >
          {generateMenuMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.generateButtonText}>Generate New Menu</Text>
          )}
        </TouchableOpacity>
      </View>

      {menus.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recommended menus yet</Text>
          <Text style={styles.emptySubtext}>
            Generate your first personalized menu!
          </Text>
        </View>
      ) : (
        <FlatList
          data={menus}
          renderItem={renderMenu}
          keyExtractor={(item) => item.menu_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  menuCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  menuDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  totalNutrition: {
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
  mealsHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  mealCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  mealType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nutritionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionText: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "white",
    padding: 4,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff3333",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
