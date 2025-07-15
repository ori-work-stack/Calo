import React, { useState, useEffect } from "react";
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
import {
  fetchMeals,
  saveMealFeedback,
  toggleMealFavorite,
  duplicateMeal,
  updateMeal,
} from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRTLStyles } from "../../hooks/useRTLStyle";
import { useMealDataRefresh } from "@/hooks/useMealDataRefresh";
import LanguageToolbar from "@/components/LanguageToolbar";
import { SafeAreaView } from "react-native-safe-area-context";

interface MealWithFeedback extends Meal {
  userRating?: number;
  expanded?: boolean;
  taste_rating?: number;
  satiety_rating?: number;
  energy_rating?: number;
  heaviness_rating?: number;
}

interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  mealType?: string;
  category?: string;
}

interface ExpandedMealData {
  [key: string]: boolean;
}

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading } = useSelector((state: RootState) => state.meal);
  const { isSavingFeedback, isTogglingFavorite, isDuplicating, isUpdating } =
    useSelector((state: RootState) => state.meal);
  const { refreshAllMealData } = useMealDataRefresh();

  const { t } = useTranslation();

  const [filteredMeals, setFilteredMeals] = useState<MealWithFeedback[]>([]);
  const [expandedMeals, setExpandedMeals] = useState<ExpandedMealData>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [smartInsight, setSmartInsight] = useState<string>("");
  const [updateText, setUpdateText] = useState("");

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
      filtered = filtered.filter(
        (meal) =>
          meal.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          meal.description?.toLowerCase().includes(searchText.toLowerCase()) ||
          meal.ingredients?.some((ing) =>
            ing.name?.toLowerCase().includes(searchText.toLowerCase())
          )
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (meal) => new Date(meal.created_at) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (meal) => new Date(meal.created_at) <= filters.dateTo!
      );
    }

    // Category filter (based on macros)
    if (filters.category) {
      filtered = filtered.filter((meal) => {
        const category = getMealCategory(meal);
        return category === filters.category;
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredMeals(filtered);
  };

  const getMealCategory = (meal: Meal): string => {
    const protein = meal.protein || meal.protein_g || 0;
    const carbs = meal.carbs || meal.carbs_g || 0;
    const fat = meal.fat || meal.fats_g || 0;
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
    const protein = meal.protein || meal.protein_g || 0;
    const carbs = meal.carbs || meal.carbs_g || 0;
    const fat = meal.fat || meal.fats_g || 0;
    const fiber = meal.fiber || meal.fiber_g || 0;

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

    // Processing level penalty
    if (
      meal.processing_level === "Ultra-processed" ||
      meal.processing_level === "ULTRA_PROCESSED"
    ) {
      score -= 1;
    }

    // Ensure score is between 1-10
    score = Math.max(1, Math.min(10, score));

    let color = "#4CAF50"; // Green
    if (score <= 4) color = "#F44336"; // Red
    else if (score <= 6) color = "#FF9800"; // Orange

    return { score, color };
  };

  const generateSmartInsight = () => {
    if (meals.length === 0) {
      setSmartInsight(
        t("history.no_meals_insight") || "Start logging meals to see insights"
      );
      return;
    }

    const lastWeekMeals = meals.filter((meal) => {
      const mealDate = new Date(meal.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return mealDate >= weekAgo;
    });

    const thisWeekCalories = lastWeekMeals.reduce(
      (sum, meal) => sum + (meal.calories || meal.totalCalories || 0),
      0
    );
    const avgDailyCalories = thisWeekCalories / 7;

    const insights = [
      t("history.insight_calories", {
        calories: Math.round(avgDailyCalories),
      }) ||
        `This week you consumed an average of ${Math.round(
          avgDailyCalories
        )} calories per day`,
      t("history.insight_meals", {
        count: lastWeekMeals.length,
      }) || `You logged ${lastWeekMeals.length} meals this week`,
      t("history.insight_score", {
        score: Math.max(...lastWeekMeals.map((m) => getMealScore(m).score)),
      }) ||
        `Your healthiest meal this week scored ${Math.max(
          ...lastWeekMeals.map((m) => getMealScore(m).score)
        )}`,
    ];

    setSmartInsight(insights[Math.floor(Math.random() * insights.length)]);
  };

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealId]: !prev[mealId],
    }));
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedMeal) return;

    const feedback = {
      tasteRating,
      satietyRating,
      energyRating,
      heavinessRating,
    };

    try {
      await dispatch(
        saveMealFeedback({
          mealId: selectedMeal.id,
          feedback,
        })
      ).unwrap();

      Alert.alert(
        t("common.success") || "Success",
        t("history.feedback_saved") ||
          "Your feedback has been saved successfully"
      );
      setShowFeedbackModal(false);
      resetFeedbackRatings();
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.feedback_error") || "Failed to save feedback"
      );
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedMeal || !updateText.trim()) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.update_text_required") || "Please enter update text"
      );
      return;
    }

    try {
      await dispatch(
        updateMeal({
          meal_id: selectedMeal.id,
          updateText: updateText.trim(),
        })
      ).unwrap();

      Alert.alert(
        t("common.success") || "Success",
        t("history.meal_updated") || "Meal updated successfully!"
      );
      setShowUpdateModal(false);
      setUpdateText("");
      setSelectedMeal(null);
      // Refresh meals
      dispatch(fetchMeals());
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.update_error") || "Failed to update meal"
      );
    }
  };

  const resetFeedbackRatings = () => {
    setTasteRating(0);
    setSatietyRating(0);
    setEnergyRating(0);
    setHeavinessRating(0);
  };

  const handleToggleFavorite = async (mealId: string) => {
    try {
      await dispatch(toggleMealFavorite(mealId)).unwrap();
      Alert.alert(
        t("common.success") || "Success",
        t("history.favorite_updated") || "Favorite status updated"
      );
    } catch (error) {
      Alert.alert(
        t("common.error") || "Error",
        t("history.favorite_error") || "Failed to update favorite status"
      );
    }
  };

  const handleDuplicateMeal = async (meal: Meal) => {
    Alert.alert(
      t("history.duplicate_meal") || "Duplicate Meal",
      t("history.duplicate_confirmation") ||
        "Would you like to duplicate this meal to today?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("common.yes") || "Yes",
          onPress: async () => {
            try {
              console.log("🔄 Starting duplicate process for meal:", meal.id);
              console.log("📋 Meal data:", meal);

              const result = await dispatch(
                duplicateMeal({
                  mealId: meal.id,
                  newDate: new Date().toISOString().split("T")[0],
                })
              ).unwrap();

              console.log("✅ Duplicate result:", result);
              Alert.alert(
                t("common.success") || "Success",
                t("history.meal_duplicated") || "Meal duplicated successfully!"
              );

              // Refresh meals to show the new duplicate
              dispatch(fetchMeals());
            } catch (error) {
              console.error("💥 Duplicate error:", error);
              Alert.alert(
                t("common.error") || "Error",
                (t("history.duplicate_error") || "Failed to duplicate meal: ") +
                  (error instanceof Error
                    ? error.message
                    : t("common.unknown_error") || "Unknown error")
              );
            }
          },
        },
      ]
    );
  };

  const handleUpdateMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setUpdateText("");
    setShowUpdateModal(true);
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

  const renderNutritionDetails = (meal: MealWithFeedback) => {
    return (
      <View style={styles.nutritionDetails}>
        <Text style={styles.nutritionDetailsTitle}>
          {t("history.detailed_nutrition") || "Detailed Nutrition Information"}
        </Text>

        {/* Basic Macros */}
        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>
            {t("meals.nutrition_info") || "Macronutrients"}
          </Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.calories") || "Calories"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.calories || 0)}
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.protein") || "Protein"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.protein || meal.protein_g || 0)}g
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.carbs") || "Carbs"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.carbs || meal.carbs_g || 0)}g
              </Text>
            </View>
            <View style={styles.nutritionDetailItem}>
              <Text style={styles.nutritionDetailLabel}>
                {t("meals.fat") || "Fat"}
              </Text>
              <Text style={styles.nutritionDetailValue}>
                {Math.round(meal.fat || meal.fats_g || 0)}g
              </Text>
            </View>
          </View>
        </View>

        {/* Extended Nutrition */}
        {(meal.fiber ||
          meal.fiber_g ||
          meal.sugar ||
          meal.sugar_g ||
          meal.sodium ||
          meal.sodium_mg) && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("statistics.additional_nutrients") || "Additional Nutrients"}
            </Text>
            <View style={styles.nutritionGrid}>
              {(meal.fiber || meal.fiber_g) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.fiber") || "Fiber"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.fiber || meal.fiber_g || 0)}g
                  </Text>
                </View>
              )}
              {(meal.sugar || meal.sugar_g) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.sugar") || "Sugar"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.sugar || meal.sugar_g || 0)}g
                  </Text>
                </View>
              )}
              {(meal.sodium || meal.sodium_mg) && (
                <View style={styles.nutritionDetailItem}>
                  <Text style={styles.nutritionDetailLabel}>
                    {t("meals.sodium") || "Sodium"}
                  </Text>
                  <Text style={styles.nutritionDetailValue}>
                    {Math.round(meal.sodium || meal.sodium_mg || 0)}mg
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Vitamins and Minerals */}
        {meal.vitamins_json && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("statistics.vitamins") || "Vitamins"}
            </Text>
            <View style={styles.nutritionGrid}>
              {Object.entries(meal.vitamins_json).map(([key, value]) => {
                if (!value || value === 0) return null;
                const vitaminName = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <View key={key} style={styles.nutritionDetailItem}>
                    <Text style={styles.nutritionDetailLabel}>
                      {vitaminName}
                    </Text>
                    <Text style={styles.nutritionDetailValue}>
                      {typeof value === "number"
                        ? Math.round(value * 100) / 100
                        : String(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {meal.micronutrients_json && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.vitamins_minerals") || "Minerals"}
            </Text>
            <View style={styles.nutritionGrid}>
              {Object.entries(meal.micronutrients_json).map(([key, value]) => {
                if (!value || value === 0) return null;
                const mineralName = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <View key={key} style={styles.nutritionDetailItem}>
                    <Text style={styles.nutritionDetailLabel}>
                      {mineralName}
                    </Text>
                    <Text style={styles.nutritionDetailValue}>
                      {typeof value === "number"
                        ? Math.round(value * 100) / 100
                        : String(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Food Analysis */}
        {(meal.processing_level ||
          meal.food_category ||
          meal.cooking_method) && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.meal_analysis") || "Food Analysis"}
            </Text>
            {meal.processing_level && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("history.processing_level") || "Processing Level"}
                </Text>
                <Text style={styles.analysisValue}>
                  {meal.processing_level}
                </Text>
              </View>
            )}
            {meal.food_category && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("history.food_category") || "Food Category"}
                </Text>
                <Text style={styles.analysisValue}>{meal.food_category}</Text>
              </View>
            )}
            {meal.cooking_method && (
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>
                  {t("food_scanner.cooking_method") || "Cooking Method"}
                </Text>
                <Text style={styles.analysisValue}>{meal.cooking_method}</Text>
              </View>
            )}
          </View>
        )}

        {/* Allergens */}
        {meal.allergens_json &&
          meal.allergens_json.possible_allergens &&
          meal.allergens_json.possible_allergens.length > 0 && (
            <View style={styles.macroSection}>
              <Text style={styles.sectionTitle}>
                {t("history.allergens") || "Possible Allergens"}
              </Text>
              <View style={styles.allergensContainer}>
                {meal.allergens_json.possible_allergens.map(
                  (allergen: string, index: number) => (
                    <View key={index} style={styles.allergenTag}>
                      <Text style={styles.allergenText}>{allergen}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

        {/* Health Warnings */}
        {meal.health_risk_notes && meal.health_risk_notes.length > 0 && (
          <View style={styles.macroSection}>
            <Text style={styles.sectionTitle}>
              {t("history.health_warnings") || "Health Warnings"}
            </Text>
            {meal.health_risk_notes.map((warning: string, index: number) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMealItem = ({ item }: { item: MealWithFeedback }) => {
    const mealScore = getMealScore(item);
    const mealDate = new Date(item.created_at);
    const isExpanded = expandedMeals[item.id];

    return (
      <View style={styles.mealCard}>
        <TouchableOpacity
          style={styles.mealHeader}
          onPress={() => toggleMealExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.mealInfo}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealName}>
                {item.name ||
                  item.meal_name ||
                  t("history.unnamed_meal") ||
                  "Unnamed Meal"}
              </Text>
              {item.is_favorite && (
                <Ionicons name="heart" size={16} color="#FF6B6B" />
              )}
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </View>
            <Text style={styles.mealTime}>
              {mealDate.toLocaleDateString()} •{" "}
              {mealDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {item.description && (
              <Text
                style={styles.mealDescription}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.description}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.scoreContainer,
              { backgroundColor: mealScore.color },
            ]}
          >
            <Text style={styles.scoreText}>{mealScore.score}</Text>
          </View>
        </TouchableOpacity>

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.mealImage} />
        )}

        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.calories || 0)}
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.calories") || "Calories"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.protein || item.protein_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.protein") || "Protein"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.carbs || item.carbs_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>
              {t("meals.carbs") || "Carbs"}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.fat || item.fats_g || 0)}g
            </Text>
            <Text style={styles.nutritionLabel}>{t("meals.fat") || "Fat"}</Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Ingredients */}
            {item.ingredients && item.ingredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.ingredientsTitle}>
                  {t("food_scanner.ingredients") || "Ingredients"} (
                  {item.ingredients.length}):
                </Text>
                {item.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    {ingredient.calories && (
                      <Text style={styles.ingredientCalories}>
                        {Math.round(ingredient.calories)} cal
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Detailed Nutrition */}
            {renderNutritionDetails(item)}
          </View>
        )}

        {/* User Ratings Display */}
        {(item.taste_rating ||
          item.satiety_rating ||
          item.energy_rating ||
          item.heaviness_rating) && (
          <View style={styles.ratingsDisplay}>
            <Text style={styles.ratingsTitle}>
              {t("history.your_ratings") || "Your Ratings"}:
            </Text>
            <View style={styles.ratingsRow}>
              {item.taste_rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>
                    {t("history.taste") || "Taste"}
                  </Text>
                  <View style={styles.miniStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= (item.taste_rating || 0)
                            ? "star"
                            : "star-outline"
                        }
                        size={12}
                        color={
                          star <= (item.taste_rating || 0) ? "#FFD700" : "#DDD"
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
              {item.satiety_rating && (
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>
                    {t("history.satiety") || "Satiety"}
                  </Text>
                  <View style={styles.miniStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={
                          star <= (item.satiety_rating || 0)
                            ? "star"
                            : "star-outline"
                        }
                        size={12}
                        color={
                          star <= (item.satiety_rating || 0)
                            ? "#FFD700"
                            : "#DDD"
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.mealActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedMeal(item);
              // Pre-fill existing ratings
              setTasteRating(item.taste_rating || 0);
              setSatietyRating(item.satiety_rating || 0);
              setEnergyRating(item.energy_rating || 0);
              setHeavinessRating(item.heaviness_rating || 0);
              setShowFeedbackModal(true);
            }}
            disabled={isSavingFeedback}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>{t("history.rate") || "Rate"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item.id)}
            disabled={isTogglingFavorite}
          >
            <Ionicons
              name={item.is_favorite ? "heart" : "heart-outline"}
              size={20}
              color="#FF6B6B"
            />
            <Text style={styles.actionText}>
              {item.is_favorite
                ? t("history.unfavorite") || "Unfavorite"
                : t("history.favorite") || "Favorite"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDuplicateMeal(item)}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons name="copy-outline" size={20} color="#4CAF50" />
            )}
            <Text style={styles.actionText}>
              {t("history.duplicate") || "Duplicate"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateMeal(item)}
            disabled={isUpdating}
          >
            <Ionicons name="create-outline" size={20} color="#FF9800" />
            <Text style={styles.actionText}>
              {t("history.update") || "Update"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onRefresh = () => {
    dispatch(fetchMeals());
  };

  const helpContent = {
    title: t("history.title") || "Meal History",
    description:
      t("history.help_description") ||
      "Here you can see all the meals you've photographed and uploaded. You can filter by meal type or date. Click on a meal to see more details or edit it.",
  };

  if (isLoading && filteredMeals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {t("common.loading") || "Loading"}...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LanguageToolbar helpContent={helpContent} />

      {/* Search and Filter Header */}
      <View style={styles.header}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("history.search_meals") || "Search meals..."}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Smart Insight */}
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
            <Text style={styles.emptyTitle}>
              {t("history.no_meals") || "No meals to display"}
            </Text>
            <Text style={styles.emptyText}>
              {t("history.start_logging") ||
                "Start logging your meals to see your history here"}
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
            <Text style={styles.modalTitle}>
              {t("history.rate_meal") || "Rate Meal"}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedMeal?.name || ""}</Text>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.taste") || "Taste"}
              </Text>
              {renderStarRating(tasteRating, setTasteRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.satiety") || "Satiety"}
              </Text>
              {renderStarRating(satietyRating, setSatietyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.energy") || "Energy"}
              </Text>
              {renderStarRating(energyRating, setEnergyRating)}
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>
                {t("history.heaviness") || "Heaviness"}
              </Text>
              {renderStarRating(heavinessRating, setHeavinessRating)}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  resetFeedbackRatings();
                }}
                disabled={isSavingFeedback}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleFeedbackSubmit}
                disabled={isSavingFeedback}
              >
                {isSavingFeedback ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("common.save") || "Save"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("history.update_meal") || "Update Meal"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t("history.add_additional_info") ||
                "Add additional information about"}{" "}
              "{selectedMeal?.name || ""}"
            </Text>

            <TextInput
              style={styles.updateInput}
              placeholder={
                t("history.enter_additional_info") ||
                "Enter additional meal information..."
              }
              value={updateText}
              onChangeText={setUpdateText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowUpdateModal(false);
                  setUpdateText("");
                  setSelectedMeal(null);
                }}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateSubmit}
                disabled={!updateText.trim() || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t("common.update") || "Update"}
                  </Text>
                )}
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
            <Text style={styles.modalTitle}>
              {t("history.filter_meals") || "Filter Meals"}
            </Text>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                {t("history.category") || "Category"}
              </Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: "", label: t("common.all") || "All" },
                  {
                    key: "high-protein",
                    label: t("history.high_protein") || "High Protein",
                  },
                  {
                    key: "high-carb",
                    label: t("history.high_carb") || "High Carb",
                  },
                  {
                    key: "high-fat",
                    label: t("history.high_fat") || "High Fat",
                  },
                  {
                    key: "balanced",
                    label: t("history.balanced") || "Balanced",
                  },
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
                <Text style={styles.cancelButtonText}>
                  {t("common.refresh") || "Reset"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.submitButtonText}>
                  {t("common.ok") || "Apply"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
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
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterButton: {
    padding: 10,
  },
  insightContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
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
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  mealTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    lineHeight: 20,
  },
  scoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
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
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
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
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  ingredientsSection: {
    padding: 15,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  ingredientName: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  ingredientQuantity: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
  ingredientCalories: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 10,
  },
  nutritionDetails: {
    padding: 15,
  },
  nutritionDetailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  macroSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionDetailItem: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    minWidth: "45%",
    flexGrow: 1,
  },
  nutritionDetailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  nutritionDetailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  analysisItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  analysisLabel: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  analysisValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  allergensContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergenTag: {
    backgroundColor: "#FFE0E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allergenText: {
    fontSize: 12,
    color: "#D32F2F",
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#FF9800",
    flex: 1,
  },
  ratingsDisplay: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  ratingsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ratingsRow: {
    flexDirection: "row",
    gap: 20,
  },
  ratingItem: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  miniStars: {
    flexDirection: "row",
    gap: 2,
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
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
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
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  updateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
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
