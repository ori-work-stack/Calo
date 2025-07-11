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
      console.log("🚀 Generating menu with preferences:", prefs);
      const response = await api.post("/recommended-menus/generate", prefs);
      console.log("✅ Menu generation response:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("🎉 Menu generated successfully:", data);
      console.log("📋 Menu data structure:", {
        success: data.success,
        hasData: !!data.data,
        menuId: data.data?.menu_id,
        mealsCount: data.data?.meals?.length,
        title: data.data?.title,
      });

      queryClient.invalidateQueries({ queryKey: ["recommendedMenus"] });
      setShowPreferences(false);

      if (data.success && data.data && data.data.menu_id) {
        setActiveMenuId(data.data.menu_id);
        const mealsCount = data.data.meals?.length || 0;
        const daysCount = data.data.days_count || 7;

        Alert.alert(
          "הצלחה!",
          `התפריט החדש נוצר בהצלחה!\n${mealsCount} ארוחות נוצרו עבור ${daysCount} ימים.\n\nמזהה תפריט: ${data.data.menu_id}`
        );

        // Force refetch to show the new menu
        setTimeout(() => {
          refetch();
        }, 1000);
      } else {
        console.warn(
          "⚠️ Menu creation succeeded but data structure is incomplete:",
          data
        );
        Alert.alert(
          "התפריט נוצר",
          "התפריט נוצר אך יש בעיה בטעינת הנתונים. אנא רענן את הדף."
        );
      }
    },
    onError: (error: any) => {
      console.error("💥 Menu generation error:", error);

      let errorMessage = "נכשל ביצירת התפריט";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Provide helpful error messages
      if (errorMessage.includes("questionnaire")) {
        errorMessage += "\n\nאנא מלא את השאלון תחילה בעמוד הפרופיל.";
      } else if (errorMessage.includes("budget")) {
        errorMessage += "\n\nאנא הגדר תקציב יומי בשאלון.";
      }

      Alert.alert("שגיאה", errorMessage);
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
                style={[
                  styles.generateButton,
                  generateMenuMutation.isPending &&
                    styles.generateButtonDisabled,
                ]}
                onPress={() => generateMenuMutation.mutate(preferences)}
                disabled={generateMenuMutation.isPending}
              >
                {generateMenuMutation.isPending ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.generateButtonText}>יוצר תפריט...</Text>
                  </View>
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
      <View style={styles.modalOverlay}>
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
      </View>
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
      <ScrollView>
        {activeMenu && (
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>{activeMenu.title}</Text>
            <Text style={styles.menuDescription}>{activeMenu.description}</Text>

            <View style={styles.menuStats}>
              <Text style={styles.statText}>
                📊 {activeMenu.total_calories} קק"ל כולל
              </Text>
              <Text style={styles.statText}>
                📅 {activeMenu.days_count} ימים
              </Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    backgroundColor: "white",
    padding: 24,
    paddingTop: 64,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 18,
    textAlign: "center",
    color: "#1a202c",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  headerButton: {
    backgroundColor: "#667eea",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  menuInfo: {
    backgroundColor: "white",
    padding: 24,
    margin: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#1a202c",
  },
  menuDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  menuStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statText: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuActions: {
    flexDirection: "row",
    gap: 12,
  },
  menuActionButton: {
    flex: 1,
    backgroundColor: "#667eea",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  menuActionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  daySelector: {
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  daySelectorContent: {
    paddingHorizontal: 16,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 6,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    minWidth: 80,
    alignItems: "center",
  },
  selectedDayButton: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  selectedDayButtonText: {
    color: "white",
    fontWeight: "700",
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  selectedFilterButton: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  selectedFilterButtonText: {
    color: "white",
    fontWeight: "700",
  },
  mealsContainer: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
    backgroundColor: "white",
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  mealTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  mealName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1a202c",
    lineHeight: 26,
  },
  mealType: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  mealActions: {
    flexDirection: "row",
    gap: 12,
  },
  nutritionSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  nutritionText: {
    fontSize: 12,
    color: "#475569",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  detailsButtonText: {
    color: "#667eea",
    fontSize: 15,
    fontWeight: "700",
  },
  mealDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1a202c",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  ingredientIcon: {
    fontSize: 16,
    width: 20,
    textAlign: "center",
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  ingredientCost: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "700",
  },
  instructionsText: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
    marginBottom: 16,
  },
  mealMeta: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "600",
  },
  detailedNutrition: {
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutritionDetail: {
    fontSize: 12,
    color: "#475569",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 85,
    textAlign: "center",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  allergensContainer: {
    marginBottom: 16,
  },
  allergensList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  allergenBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  allergenText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  mealActionButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#667eea",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  lowCalorieButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  actionButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
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
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likeButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  dislikeButton: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
  },
  feedbackButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 24,
    padding: 28,
    maxHeight: "85%",
    width: screenWidth - 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#1a202c",
  },
  preferenceLabel: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
    color: "#1a202c",
  },
  optionGroup: {
    marginBottom: 24,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  selectedOption: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  optionText: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    fontWeight: "600",
  },
  selectedOptionText: {
    color: "white",
    fontWeight: "700",
  },
  checkboxGroup: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  checkboxText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "700",
  },
  generateButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#667eea",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shoppingListContent: {
    maxHeight: 400,
  },
  totalCost: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#667eea",
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1a202c",
    textTransform: "capitalize",
  },
  shoppingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: 13,
    color: "#64748b",
    marginHorizontal: 12,
    fontWeight: "600",
  },
  itemCost: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
    color: "#1a202c",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 24,
  },
  createFirstMenuButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 28,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createFirstMenuButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    color: "#64748b",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#667eea",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  noDataText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    marginTop: 24,
    fontWeight: "600",
  },
});
