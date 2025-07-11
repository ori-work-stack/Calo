import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Image,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

interface Ingredient {
  ingredient_id?: string;
  name: string;
  name_english?: string;
  quantity: number;
  unit: string;
  unit_english?: string;
  category: string;
  estimated_cost?: number;
  calories_per_unit?: number;
  protein_per_unit?: number;
  icon?: string;
}

interface Meal {
  meal_id: string;
  name: string;
  name_english?: string;
  meal_type: string;
  day_number: number;
  meal_time?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  prep_time_minutes: number;
  cooking_method?: string;
  difficulty?: string;
  instructions: string;
  instructions_english?: string;
  category?: string;
  allergens?: string[];
  is_favorite?: boolean;
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
  total_fiber?: number;
  days_count: number;
  dietary_category: string;
  estimated_cost?: number;
  prep_time_minutes?: number;
  difficulty_level?: number;
  meal_structure?: string;
  created_at: string;
  meals: Meal[];
}

interface MenuPreferences {
  mealsPerDay: string;
  mealChangeFrequency: string;
  includeLeftovers: boolean;
  sameMealTimes: boolean;
}

const MEAL_TYPE_HEBREW = {
  BREAKFAST: "ארוחת בוקר",
  LUNCH: "ארוחת צהריים",
  DINNER: "ארוחת ערב",
  SNACK: "נשנוש",
  INTERMEDIATE: "ארוחת ביניים",
};

const DAYS_HEBREW = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const CATEGORY_COLORS = {
  vegetarian: "#4CAF50",
  vegan: "#8BC34A",
  gluten_free: "#FF9800",
  keto: "#9C27B0",
  protein: "#F44336",
  balanced: "#2196F3",
};

export default function RecommendedMenusScreen() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showMealDetails, setShowMealDetails] = useState<string | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterMealType, setFilterMealType] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<MenuPreferences>({
    mealsPerDay: "3_main",
    mealChangeFrequency: "daily",
    includeLeftovers: false,
    sameMealTimes: true,
  });

  const queryClient = useQueryClient();

  const {
    data: menusData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendedMenus"],
    queryFn: async () => {
      const response = await api.get("/recommended-menus");
      return response.data;
    },
  });

  const { data: shoppingListData, isLoading: isLoadingShoppingList } = useQuery(
    {
      queryKey: ["shoppingList", activeMenuId],
      queryFn: async () => {
        if (!activeMenuId) return null;
        const response = await api.get(
          `/recommended-menus/${activeMenuId}/shopping-list`
        );
        return response.data;
      },
      enabled: !!activeMenuId && showShoppingList,
    }
  );

  const generateMenuMutation = useMutation({
    mutationFn: async (prefs: MenuPreferences) => {
      const response = await api.post("/recommended-menus/generate", prefs);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendedMenus"] });
      setShowPreferences(false);
      Alert.alert("הצלחה!", "התפריט החדש נוצר בהצלחה!");
    },
    onError: (error: any) => {
      Alert.alert("שגיאה", error.response?.data?.error || "נכשל ביצירת התפריט");
    },
  });

  const replaceMealMutation = useMutation({
    mutationFn: async ({
      menuId,
      mealId,
    }: {
      menuId: string;
      mealId: string;
    }) => {
      const response = await api.post(
        `/recommended-menus/${menuId}/replace-meal`,
        {
          mealId,
          preferences: { dietary_style: "healthy" },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendedMenus"] });
      Alert.alert("הצלחה!", "המנה הוחלפה בהצלחה!");
    },
    onError: (error: any) => {
      Alert.alert("שגיאה", "נכשל בהחלפת המנה");
    },
  });

  const favoriteMealMutation = useMutation({
    mutationFn: async ({
      menuId,
      mealId,
      isFavorite,
    }: {
      menuId: string;
      mealId: string;
      isFavorite: boolean;
    }) => {
      const response = await api.post(
        `/recommended-menus/${menuId}/favorite-meal`,
        {
          mealId,
          isFavorite,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendedMenus"] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({
      menuId,
      mealId,
      liked,
    }: {
      menuId: string;
      mealId: string;
      liked: boolean;
    }) => {
      const response = await api.post(
        `/recommended-menus/${menuId}/meal-feedback`,
        {
          mealId,
          liked,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("תודה!", "המשוב נשמר בהצלחה");
    },
  });

  const startMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const response = await api.post(
        `/recommended-menus/${menuId}/start-today`
      );
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("הצלחה!", "התפריט התחיל להיום!");
    },
  });

  const menus = menusData?.data || [];
  const activeMenu =
    menus.find((menu: RecommendedMenu) => menu.menu_id === activeMenuId) ||
    menus[0];

  const getCurrentDayMeals = () => {
    if (!activeMenu) return [];
    return activeMenu.meals
      .filter((meal: Meal) => meal.day_number === selectedDay)
      .filter((meal: Meal) =>
        filterMealType ? meal.meal_type === filterMealType : true
      )
      .sort((a: Meal, b: Meal) => {
        const order = ["BREAKFAST", "SNACK", "LUNCH", "INTERMEDIATE", "DINNER"];
        return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
      });
  };

  const renderMealCard = (meal: Meal) => (
    <View key={meal.meal_id} style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealType}>
            {MEAL_TYPE_HEBREW[meal.meal_type as keyof typeof MEAL_TYPE_HEBREW]}{" "}
            {meal.meal_time && `• ${meal.meal_time}`}
          </Text>
        </View>
        <View style={styles.mealActions}>
          <TouchableOpacity
            onPress={() =>
              favoriteMealMutation.mutate({
                menuId: activeMenu.menu_id,
                mealId: meal.meal_id,
                isFavorite: !meal.is_favorite,
              })
            }
          >
            <Ionicons
              name={meal.is_favorite ? "heart" : "heart-outline"}
              size={24}
              color={meal.is_favorite ? "#FF6B6B" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.nutritionSummary}>
        <Text style={styles.nutritionText}>🔥 {meal.calories} קק"ל</Text>
        <Text style={styles.nutritionText}>🥩 {meal.protein}ג חלבון</Text>
        <Text style={styles.nutritionText}>🍞 {meal.carbs}ג פחמימות</Text>
        <Text style={styles.nutritionText}>🥑 {meal.fat}ג שומן</Text>
      </View>

      {meal.category && (
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor:
                CATEGORY_COLORS[
                  meal.category as keyof typeof CATEGORY_COLORS
                ] || "#666",
            },
          ]}
        >
          <Text style={styles.categoryText}>{meal.category}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => setShowMealDetails(meal.meal_id)}
      >
        <Text style={styles.detailsButtonText}>הצג פרטים</Text>
        <Ionicons name="chevron-down" size={16} color="#007AFF" />
      </TouchableOpacity>

      {showMealDetails === meal.meal_id && (
        <View style={styles.mealDetails}>
          <Text style={styles.detailsTitle}>רכיבים:</Text>
          {meal.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientIcon}>
                {ingredient.icon || "🔸"}
              </Text>
              <Text style={styles.ingredientText}>
                {ingredient.name} - {ingredient.quantity} {ingredient.unit}
              </Text>
              {ingredient.estimated_cost && (
                <Text style={styles.ingredientCost}>
                  ₪{ingredient.estimated_cost.toFixed(1)}
                </Text>
              )}
            </View>
          ))}

          <Text style={styles.detailsTitle}>הוראות הכנה:</Text>
          <Text style={styles.instructionsText}>{meal.instructions}</Text>

          <View style={styles.mealMeta}>
            <Text style={styles.metaText}>
              ⏱️ זמן הכנה: {meal.prep_time_minutes} דק'
            </Text>
            {meal.cooking_method && (
              <Text style={styles.metaText}>
                👨‍🍳 שיטת הכנה: {meal.cooking_method}
              </Text>
            )}
            {meal.difficulty && (
              <Text style={styles.metaText}>
                📊 רמת קושי: {meal.difficulty}
              </Text>
            )}
          </View>

          <View style={styles.detailedNutrition}>
            <Text style={styles.detailsTitle}>ערכים תזונתיים מפורטים:</Text>
            <View style={styles.nutritionGrid}>
              <Text style={styles.nutritionDetail}>
                קלוריות: {meal.calories}
              </Text>
              <Text style={styles.nutritionDetail}>חלבון: {meal.protein}ג</Text>
              <Text style={styles.nutritionDetail}>פחמימות: {meal.carbs}ג</Text>
              <Text style={styles.nutritionDetail}>שומן: {meal.fat}ג</Text>
              {meal.fiber && (
                <Text style={styles.nutritionDetail}>סיבים: {meal.fiber}ג</Text>
              )}
              {meal.sugar && (
                <Text style={styles.nutritionDetail}>סוכר: {meal.sugar}ג</Text>
              )}
              {meal.sodium && (
                <Text style={styles.nutritionDetail}>
                  נתרן: {meal.sodium}מ"ג
                </Text>
              )}
              {meal.cholesterol && (
                <Text style={styles.nutritionDetail}>
                  כולסטרול: {meal.cholesterol}מ"ג
                </Text>
              )}
            </View>
          </View>

          {meal.allergens && meal.allergens.length > 0 && (
            <View style={styles.allergensContainer}>
              <Text style={styles.detailsTitle}>אלרגנים:</Text>
              <View style={styles.allergensList}>
                {meal.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenBadge}>
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.mealActionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                replaceMealMutation.mutate({
                  menuId: activeMenu.menu_id,
                  mealId: meal.meal_id,
                })
              }
            >
              <Text style={styles.actionButtonText}>החלף ארוחה</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.lowCalorieButton]}
              onPress={() => Alert.alert("בקרוב", "גרסה עם פחות קלוריות בקרוב")}
            >
              <Text style={styles.actionButtonText}>גרסה עם פחות קלוריות</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={[styles.feedbackButton, styles.likeButton]}
              onPress={() =>
                feedbackMutation.mutate({
                  menuId: activeMenu.menu_id,
                  mealId: meal.meal_id,
                  liked: true,
                })
              }
            >
              <Ionicons name="thumbs-up" size={20} color="white" />
              <Text style={styles.feedbackButtonText}>אהבתי</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.feedbackButton, styles.dislikeButton]}
              onPress={() =>
                feedbackMutation.mutate({
                  menuId: activeMenu.menu_id,
                  mealId: meal.meal_id,
                  liked: false,
                })
              }
            >
              <Ionicons name="thumbs-down" size={20} color="white" />
              <Text style={styles.feedbackButtonText}>לא אהבתי</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderDaySelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.daySelector}
      contentContainerStyle={styles.daySelectorContent}
    >
      {DAYS_HEBREW.map((day, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dayButton,
            selectedDay === index + 1 && styles.selectedDayButton,
          ]}
          onPress={() => setSelectedDay(index + 1)}
        >
          <Text
            style={[
              styles.dayButtonText,
              selectedDay === index + 1 && styles.selectedDayButtonText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMealTypeFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      <TouchableOpacity
        style={[
          styles.filterButton,
          !filterMealType && styles.selectedFilterButton,
        ]}
        onPress={() => setFilterMealType(null)}
      >
        <Text
          style={[
            styles.filterButtonText,
            !filterMealType && styles.selectedFilterButtonText,
          ]}
        >
          הכל
        </Text>
      </TouchableOpacity>
      {Object.entries(MEAL_TYPE_HEBREW).map(([type, hebrewName]) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.filterButton,
            filterMealType === type && styles.selectedFilterButton,
          ]}
          onPress={() => setFilterMealType(type)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterMealType === type && styles.selectedFilterButtonText,
            ]}
          >
            {hebrewName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPreferencesModal = () => (
    <Modal
      visible={showPreferences}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreferences(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>בחירת תבנית תפריט</Text>

            <Text style={styles.preferenceLabel}>כמות ארוחות יומית:</Text>
            <View style={styles.optionGroup}>
              {[
                { value: "3_main", label: "3 ארוחות עיקריות" },
                { value: "3_plus_2_snacks", label: "3 + 2 נשנושים" },
                {
                  value: "2_plus_1_intermediate",
                  label: "2 + 1 ביניים (צום לסירוגין)",
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    preferences.mealsPerDay === option.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      mealsPerDay: option.value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      preferences.mealsPerDay === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.preferenceLabel}>תדירות החלפת מנות:</Text>
            <View style={styles.optionGroup}>
              {[
                { value: "daily", label: "כל יום" },
                { value: "every_3_days", label: "כל 3 ימים" },
                { value: "weekly", label: "אחת לשבוע" },
                { value: "automatic", label: "אוטומטי לפי התקדמות" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    preferences.mealChangeFrequency === option.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      mealChangeFrequency: option.value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      preferences.mealChangeFrequency === option.value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    includeLeftovers: !prev.includeLeftovers,
                  }))
                }
              >
                <Ionicons
                  name={
                    preferences.includeLeftovers
                      ? "checkbox"
                      : "checkbox-outline"
                  }
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.checkboxText}>כלול שאריות/מיחזור מנות</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    sameMealTimes: !prev.sameMealTimes,
                  }))
                }
              >
                <Ionicons
                  name={
                    preferences.sameMealTimes ? "checkbox" : "checkbox-outline"
                  }
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.checkboxText}>מנות באותה שעה כל יום</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPreferences(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => generateMenuMutation.mutate(preferences)}
                disabled={generateMenuMutation.isPending}
              >
                {generateMenuMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.generateButtonText}>צור תפריט</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderShoppingListModal = () => (
    <Modal
      visible={showShoppingList}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowShoppingList(false)}
    >
      <ScrollView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>רשימת קניות</Text>
            <TouchableOpacity onPress={() => setShowShoppingList(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isLoadingShoppingList ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : shoppingListData?.data ? (
            <ScrollView style={styles.shoppingListContent}>
              <Text style={styles.totalCost}>
                עלות משוערת: ₪
                {shoppingListData.data.total_estimated_cost?.toFixed(2)}
              </Text>

              {Object.entries(shoppingListData.data.categories).map(
                ([category, items]) => {
                  const typedItems = items as any[]; // or better: as ItemType[] if you have a defined type
                  return (
                    <View key={category} style={styles.categorySection}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      {typedItems.map((item, index) => (
                        <View key={index} style={styles.shoppingItem}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemQuantity}>
                            {item.quantity} {item.unit}
                          </Text>
                          {item.estimated_cost && (
                            <Text style={styles.itemCost}>
                              ₪{item.estimated_cost.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  );
                }
              )}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>לא ניתן לטעון את רשימת הקניות</Text>
          )}
        </View>
      </ScrollView>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>טוען תפריטים מומלצים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>נכשל בטעינת התפריטים</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!menus.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>התפריטים המומלצים שלי</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant" size={80} color="#ddd" />
          <Text style={styles.emptyText}>עדיין אין לך תפריטים מומלצים</Text>
          <Text style={styles.emptySubtext}>צור את התפריט הראשון שלך!</Text>

          <TouchableOpacity
            style={styles.createFirstMenuButton}
            onPress={() => setShowPreferences(true)}
          >
            <Text style={styles.createFirstMenuButtonText}>
              צור תפריט ראשון
            </Text>
          </TouchableOpacity>
        </View>

        {renderPreferencesModal()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>התפריטים המומלצים שלי</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowPreferences(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.headerButtonText}>תפריט חדש</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeMenu && (
        <View style={styles.menuInfo}>
          <Text style={styles.menuTitle}>{activeMenu.title}</Text>
          <Text style={styles.menuDescription}>{activeMenu.description}</Text>

          <View style={styles.menuStats}>
            <Text style={styles.statText}>
              📊 {activeMenu.total_calories} קק"ל כולל
            </Text>
            <Text style={styles.statText}>📅 {activeMenu.days_count} ימים</Text>
            {activeMenu.estimated_cost && (
              <Text style={styles.statText}>
                💰 ₪{activeMenu.estimated_cost}
              </Text>
            )}
          </View>

          <View style={styles.menuActions}>
            <TouchableOpacity
              style={styles.menuActionButton}
              onPress={() => startMenuMutation.mutate(activeMenu.menu_id)}
            >
              <Text style={styles.menuActionButtonText}>התחל היום</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuActionButton, styles.secondaryButton]}
              onPress={() => {
                setActiveMenuId(activeMenu.menu_id);
                setShowShoppingList(true);
              }}
            >
              <Text style={styles.menuActionButtonText}>רשימת קניות</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderDaySelector()}
      {renderMealTypeFilter()}

      <ScrollView
        style={styles.mealsContainer}
        showsVerticalScrollIndicator={false}
      >
        {getCurrentDayMeals().map(renderMealCard)}
      </ScrollView>

      {renderPreferencesModal()}
      {renderShoppingListModal()}
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
  headerActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  headerButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  headerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  menuInfo: {
    backgroundColor: "white",
    padding: 20,
    margin: 15,
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
    textAlign: "center",
  },
  menuDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  menuStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
  },
  statText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  menuActions: {
    flexDirection: "row",
    gap: 10,
  },
  menuActionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  menuActionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  daySelector: {
    paddingVertical: 10,
  },
  daySelectorContent: {
    paddingHorizontal: 15,
  },
  dayButton: {
    padding: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedDayButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  dayButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  selectedDayButtonText: {
    color: "white",
  },
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filterButton: {
    padding: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedFilterButton: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666",
  },
  selectedFilterButtonText: {
    color: "white",
  },
  mealsContainer: {
    flex: 1,
    padding: 15,
  },
  mealCard: {
    backgroundColor: "white",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  mealType: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
  },
  mealActions: {
    flexDirection: "row",
    gap: 10,
  },
  nutritionSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  nutritionText: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "#f9f9f9",
    padding: 4,
    borderRadius: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailsButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mealDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 10,
  },
  ingredientIcon: {
    fontSize: 16,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
  },
  ingredientCost: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  instructionsText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 15,
  },
  mealMeta: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailedNutrition: {
    marginBottom: 15,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionDetail: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "#f0f8ff",
    padding: 6,
    borderRadius: 4,
    minWidth: 80,
  },
  allergensContainer: {
    marginBottom: 15,
  },
  allergensList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  allergenBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allergenText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  mealActionButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  lowCalorieButton: {
    backgroundColor: "#34C759",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 10,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: 10,
    borderRadius: 8,
  },
  likeButton: {
    backgroundColor: "#34C759",
  },
  dislikeButton: {
    backgroundColor: "#FF6B6B",
  },
  feedbackButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "scroll",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
    width: screenWidth - 40,
    overflow: "scroll",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 15,
  },
  optionGroup: {
    marginBottom: 20,
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  selectedOptionText: {
    color: "white",
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  generateButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  shoppingListContent: {
    maxHeight: 400,
  },
  totalCost: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#007AFF",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textTransform: "capitalize",
  },
  shoppingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 10,
  },
  itemCost: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
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
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  createFirstMenuButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createFirstMenuButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  noDataText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
});
