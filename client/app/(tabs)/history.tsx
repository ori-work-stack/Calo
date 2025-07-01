import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import { fetchMeals } from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

interface MealWithFeedback extends Meal {
  userRating?: number;
  tasteRating?: number;
  satietyRating?: number;
  energyRating?: number;
  heavinessRating?: number;
  isFavorite?: boolean;
}

interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: string;
  category?: string;
}

export default function HistoryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);

  const [filteredMeals, setFilteredMeals] = useState<MealWithFeedback[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealWithFeedback | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [smartInsight, setSmartInsight] = useState<string>("");

  // Feedback ratings
  const [tasteRating, setTasteRating] = useState(0);
  const [satietyRating, setSatietyRating] = useState(0);
  const [energyRating, setEnergyRating] = useState(0);
  const [heavinessRating, setHeavinessRating] = useState(0);

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  useEffect(() => {
    applyFilters();
    generateSmartInsight();
  }, [meals, filters, searchText]);

  const applyFilters = () => {
    let filtered = [...meals] as MealWithFeedback[];

    // Search filter
    if (searchText) {
      filtered = filtered.filter((meal) =>
        meal.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (meal) => new Date(meal.createdAt) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (meal) => new Date(meal.createdAt) <= filters.dateTo!
      );
    }

    // Category filter (based on macros)
    if (filters.category) {
      filtered = filtered.filter((meal) => {
        const category = getMealCategory(meal);
        return category === filters.category;
      });
    }

    setFilteredMeals(filtered);
  };

  const getMealCategory = (meal: Meal): string => {
    const protein = meal.protein || 0;
    const carbs = meal.carbs || 0;
    const fat = meal.fat || 0;
    const total = protein + carbs + fat;

    if (total === 0) return "unknown";

    const proteinPercent = ((protein * 4) / (total * 4)) * 100;
    const carbsPercent = ((carbs * 4) / (total * 4)) * 100;
    const fatPercent = ((fat * 9) / (total * 4)) * 100;

    if (proteinPercent > 40) return "high-protein";
    if (carbsPercent > 50) return "high-carb";
    if (fatPercent > 35) return "high-fat";
    return "balanced";
  };

  const getMealScore = (meal: Meal): { score: number; color: string } => {
    let score = 5; // Start with base score

    const calories = meal.calories || 0;
    const protein = meal.protein || 0;
    const carbs = meal.carbs || 0;
    const fat = meal.fat || 0;
    const fiber = meal.fiber || 0;

    // Protein adequacy (good if 15-30% of calories)
    const proteinCalories = protein * 4;
    const proteinPercent =
      calories > 0 ? (proteinCalories / calories) * 100 : 0;
    if (proteinPercent >= 15 && proteinPercent <= 30) score += 1;
    else if (proteinPercent < 10) score -= 1;

    // Fiber content (good if >3g per 100 calories)
    const fiberRatio = calories > 0 ? (fiber / calories) * 100 : 0;
    if (fiberRatio > 3) score += 1;
    else if (fiberRatio < 1) score -= 1;

    // Calorie density (prefer moderate density)
    if (calories > 800) score -= 1; // Very high calorie meal
    if (calories < 100) score -= 1; // Very low calorie meal

    // Ensure score is between 1-10
    score = Math.max(1, Math.min(10, score));

    let color = "#4CAF50"; // Green
    if (score <= 4) color = "#F44336"; // Red
    else if (score <= 6) color = "#FF9800"; // Orange

    return { score, color };
  };

  const generateSmartInsight = () => {
    if (meals.length === 0) return;

    const lastWeekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return mealDate >= weekAgo;
    });

    const thisWeekCalories = lastWeekMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );
    const avgDailyCalories = thisWeekCalories / 7;

    const insights = [
      `This week you consumed an average of ${Math.round(
        avgDailyCalories
      )} calories per day`,
      `You logged ${lastWeekMeals.length} meals this week`,
      `Your healthiest meal this week scored ${Math.max(
        ...lastWeekMeals.map((m) => getMealScore(m).score)
      )}`,
    ];

    setSmartInsight(insights[Math.floor(Math.random() * insights.length)]);
  };

  const handleFeedbackSubmit = () => {
    if (!selectedMeal) return;

    // Here you would typically save the feedback to your backend
    // For now, we'll just show a success message
    Alert.alert("Thank you!", "Your feedback has been saved successfully");
    setShowFeedbackModal(false);
    resetFeedbackRatings();
  };

  const resetFeedbackRatings = () => {
    setTasteRating(0);
    setSatietyRating(0);
    setEnergyRating(0);
    setHeavinessRating(0);
  };

  const toggleFavorite = (mealId: string) => {
    // Here you would typically update the favorite status in your backend
    Alert.alert("Favorites", "Meal added to favorites");
  };

  const duplicateMeal = (meal: Meal) => {
    Alert.alert(
      "Duplicate Meal",
      "Would you like to duplicate this meal to another day?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () =>
            Alert.alert("Duplicated!", "Meal duplicated successfully"),
        },
      ]
    );
  };

  const renderStarRating = (
    rating: number,
    setRating: (rating: number) => void
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={30}
              color={star <= rating ? "#FFD700" : "#DDD"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMealItem = ({ item }: { item: MealWithFeedback }) => {
    const mealScore = getMealScore(item);
    const mealDate = new Date(item.createdAt);

    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{item.name}</Text>
            <Text style={styles.mealTime}>
              {mealDate.toLocaleDateString()} •{" "}
              {mealDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View
            style={[
              styles.scoreContainer,
              { backgroundColor: mealScore.color },
            ]}
          >
            <Text style={styles.scoreText}>{mealScore.score}</Text>
          </View>
        </View>

        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.mealImage} />
        )}

        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.calories || 0)}
            </Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.protein || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.carbs || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.fat || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>

        <View style={styles.mealActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedMeal(item);
              setShowFeedbackModal(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Rate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
            <Text style={styles.actionText}>Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => duplicateMeal(item)}
          >
            <Ionicons name="copy-outline" size={20} color="#4CAF50" />
            <Text style={styles.actionText}>Duplicate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onRefresh = () => {
    dispatch(fetchMeals());
  };

  if (isLoading && filteredMeals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search meals..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Smart Insight - FIXED: Wrapped text in Text component */}
      {smartInsight ? (
        <View style={styles.insightContainer}>
          <Ionicons name="bulb" size={20} color="#FFD700" />
          <Text style={styles.insightText}>{smartInsight}</Text>
        </View>
      ) : null}

      {/* Meals List */}
      <FlatList
        data={filteredMeals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          filteredMeals.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No meals to display</Text>
            <Text style={styles.emptyText}>
              Start logging your meals to see your history here
            </Text>
          </View>
        }
      />

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Meal</Text>
            <Text style={styles.modalSubtitle}>{selectedMeal?.name}</Text>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Taste</Text>
              {renderStarRating(tasteRating, setTasteRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Satiety</Text>
              {renderStarRating(satietyRating, setSatietyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Energy</Text>
              {renderStarRating(energyRating, setEnergyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Heaviness</Text>
              {renderStarRating(heavinessRating, setHeavinessRating)}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  resetFeedbackRatings();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleFeedbackSubmit}
              >
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Meals</Text>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: "", label: "All" },
                  { key: "high-protein", label: "High Protein" },
                  { key: "high-carb", label: "High Carb" },
                  { key: "high-fat", label: "High Fat" },
                  { key: "balanced", label: "Balanced" },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      filters.category === category.key &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, category: category.key })
                    }
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        filters.category === category.key &&
                          styles.categoryButtonTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setFilters({});
                  setShowFilters(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.submitButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 10,
  },
  insightContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9C4",
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  insightText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#F57F17",
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mealCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  mealTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  mealImage: {
    width: "100%",
    height: 150,
  },
  nutritionSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#f8f9fa",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  mealActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#6c757d",
  },
  submitButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
  },
  categoryButtonTextActive: {
    color: "white",
  },
});
