import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import {
  analyzeMeal,
  postMeal,
  updateMeal,
  clearPendingMeal,
  clearError,
  loadPendingMeal,
} from "@/src/store/mealSlice";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "@/src/i18n";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [postedMealId, setPostedMealId] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string>("");
  const cameraRef = useRef<CameraView>(null);

  // Edit analysis modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);

  // Edit ingredients modal states
  const [showEditIngredientsModal, setShowEditIngredientsModal] =
    useState(false);
  const [editableIngredients, setEditableIngredients] = useState<string>("");

  // Load pending meal on component mount
  useEffect(() => {
    dispatch(loadPendingMeal());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      let title = t("common.error");
      let message = error;

      // Check for specific error types
      if (error.includes("quota") || error.includes("429")) {
        title = t("camera.quota_exceeded_title");
        message = t("camera.quota_exceeded_message");
      } else if (error.includes("network") || error.includes("connection")) {
        title = t("camera.connection_error_title");
        message = t("camera.connection_error_message");
      }

      Alert.alert(title, message, [
        { text: t("common.ok"), onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch, t]);

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          console.log("Media library permission not granted");
        }
      }
    })();
  }, []);

  // Check if we have a persisted meal ID when component mounts or pendingMeal changes
  useEffect(() => {
    const checkPersistedMealId = async () => {
      try {
        const savedMealId = await AsyncStorage.getItem("postedMealId");
        if (savedMealId && pendingMeal) {
          setPostedMealId(savedMealId);
        }
      } catch (error) {
        console.error("Error loading persisted meal ID:", error);
      }
    };

    if (pendingMeal) {
      checkPersistedMealId();
      // Store the original image base64 when pendingMeal is available
      if (pendingMeal.image_base_64) {
        setOriginalImageBase64(pendingMeal.image_base_64);
      }
    }
  }, [pendingMeal]);

  const saveMealId = async (mealId: string) => {
    try {
      await AsyncStorage.setItem("postedMealId", mealId);
    } catch (error) {
      console.error("Error saving meal ID:", error);
    }
  };

  const clearMealId = async () => {
    try {
      await AsyncStorage.removeItem("postedMealId");
    } catch (error) {
      console.error("Error clearing meal ID:", error);
    }
  };

  const getIngredientIcon = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    if (
      name.includes("rice") ||
      name.includes("quinoa") ||
      name.includes("pasta") ||
      name.includes("bread") ||
      name.includes("oats")
    )
      return "leaf-outline";
    if (
      name.includes("chicken") ||
      name.includes("beef") ||
      name.includes("pork") ||
      name.includes("fish") ||
      name.includes("salmon") ||
      name.includes("turkey")
    )
      return "restaurant-outline";
    if (
      name.includes("cheese") ||
      name.includes("milk") ||
      name.includes("yogurt") ||
      name.includes("cream")
    )
      return "cafe-outline";
    if (
      name.includes("broccoli") ||
      name.includes("carrot") ||
      name.includes("peas") ||
      name.includes("lettuce") ||
      name.includes("spinach") ||
      name.includes("tomato") ||
      name.includes("pepper")
    )
      return "leaf";
    if (
      name.includes("oil") ||
      name.includes("butter") ||
      name.includes("avocado") ||
      name.includes("nuts") ||
      name.includes("seeds")
    )
      return "water-outline";
    if (
      name.includes("apple") ||
      name.includes("banana") ||
      name.includes("orange") ||
      name.includes("berry") ||
      name.includes("fruit")
    )
      return "nutrition-outline";
    if (name.includes("egg")) return "ellipse-outline";
    if (
      name.includes("bean") ||
      name.includes("lentil") ||
      name.includes("chickpea")
    )
      return "fitness-outline";
    return "nutrition-outline";
  };

  const validateAndProcessImage = (base64Data: string): string | null => {
    try {
      if (!base64Data || base64Data.trim() === "") {
        console.error("Empty base64 data");
        return null;
      }

      // Remove data URL prefix if present
      let cleanBase64 = base64Data;
      if (base64Data.startsWith("data:image/")) {
        const commaIndex = base64Data.indexOf(",");
        if (commaIndex !== -1) {
          cleanBase64 = base64Data.substring(commaIndex + 1);
        }
      }

      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanBase64)) {
        console.error("Invalid base64 format");
        return null;
      }

      // Check minimum length (should be substantial for an image)
      if (cleanBase64.length < 1000) {
        console.error("Base64 data too short, likely not a valid image");
        return null;
      }

      console.log(
        "✅ Image validation successful, length:",
        cleanBase64.length
      );
      return cleanBase64;
    } catch (error) {
      console.error("Error validating image:", error);
      return null;
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      console.log("🔍 Starting meal analysis with base64 data...");

      // Get current language from i18n
      const currentLanguage = i18n.language || "en";
      console.log("🌐 Current language for analysis:", currentLanguage);

      const validatedBase64 = validateAndProcessImage(base64Image);
      if (!validatedBase64) {
        Alert.alert(t("common.error"), t("camera.analysis_failed"));
        return;
      }

      // Store the original image base64 for later use
      setOriginalImageBase64(validatedBase64);
      setPostedMealId(null);
      await clearMealId();

      console.log("📤 Dispatching analyze meal action...");
      const result = await dispatch(
        analyzeMeal({
          imageBase64: validatedBase64,
          language: currentLanguage,
        })
      );

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Analysis completed successfully");
      } else {
        console.error("❌ Analysis failed:", result.payload);
        Alert.alert(t("common.error"), t("camera.analysis_failed"));
      }
    } catch (error) {
      console.error("💥 Analysis error details:", error);
      Alert.alert(t("common.error"), t("camera.analysis_failed"));
    }
  };

  const analyzeImageWithText = async (additionalText: string) => {
    try {
      console.log("🔍 Re-analyzing image with additional text...");
      setIsEditingAnalysis(true);

      // Get current language from i18n
      const currentLanguage = i18n.language || "en";
      console.log("🌐 Current language for analysis:", currentLanguage);

      // Use stored original image base64 instead of pendingMeal.image_base_64
      const imageToUse = originalImageBase64 || pendingMeal?.image_base_64;

      if (!imageToUse) {
        Alert.alert(t("common.error"), t("camera.re_analysis_failed"));
        return;
      }

      const validatedBase64 = validateAndProcessImage(imageToUse);
      if (!validatedBase64) {
        Alert.alert(t("common.error"), t("camera.analysis_failed"));
        return;
      }

      const result = await dispatch(
        analyzeMeal({
          imageBase64: validatedBase64,
          updateText: additionalText,
          language: currentLanguage,
        })
      );

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Re-analysis completed successfully");
      } else {
        console.error("❌ Re-analysis failed:", result.payload);
        Alert.alert(t("common.error"), t("camera.re_analysis_failed"));
      }
    } catch (error) {
      console.error("💥 Re-analysis error:", error);
      Alert.alert(t("common.error"), t("camera.re_analysis_failed"));
    } finally {
      setIsEditingAnalysis(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log("🖼️ Attempting to pick image...");

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
        exif: false,
      });

      console.log("📋 Image picker result canceled:", result.canceled);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("📋 Asset details:", {
          uri: asset.uri,
          hasBase64: !!asset.base64,
          base64Length: asset.base64?.length || 0,
        });

        if (asset.base64) {
          console.log("✅ Image selected, base64 length:", asset.base64.length);
          await analyzeImage(asset.base64);
        } else {
          console.error("❌ No base64 data in selected image");
          Alert.alert(t("common.error"), t("camera.analysis_failed"));
        }
      } else {
        console.log("📱 User canceled image selection");
      }
    } catch (error) {
      console.error("💥 Error in pickImage:", error);
      Alert.alert(t("common.error"), t("camera.analysis_failed"));
    }
  };

  const handlePost = async () => {
    if (pendingMeal && !isPosting) {
      console.log("📤 Posting meal...");
      const result = await dispatch(postMeal());

      if (postMeal.fulfilled.match(result)) {
        const mealId = result.payload?.meal_id?.toString();
        console.log("✅ Meal posted successfully with ID:", mealId);

        if (mealId) {
          setPostedMealId(mealId);
          await saveMealId(mealId);
          Alert.alert(t("common.success"), t("camera.save_success"));
        } else {
          const tempId = "temp_" + Date.now();
          setPostedMealId(tempId);
          await saveMealId(tempId);
          Alert.alert(t("common.success"), t("camera.save_success"));
        }
      } else {
        console.error("❌ Meal post failed:", result.payload);
        Alert.alert(t("common.error"), t("camera.save_failed"));
      }
    }
  };

  const handleUpdate = () => {
    if (!postedMealId) {
      Alert.alert(t("camera.save_required"), t("camera.save_before_update"), [
        { text: t("common.ok") },
      ]);
      return;
    }
    setShowUpdateModal(true);
    setUpdateText("");
  };

  const handleUpdateSubmit = async () => {
    if (!postedMealId || !updateText.trim()) {
      Alert.alert(t("common.error"), t("camera.update_required"));
      return;
    }

    try {
      const result = await dispatch(
        updateMeal({
          meal_id: postedMealId,
          updateText: updateText.trim(),
        })
      );

      if (updateMeal.fulfilled.match(result)) {
        Alert.alert(t("common.success"), t("camera.update_success"));
        setShowUpdateModal(false);
        setUpdateText("");
        dispatch(clearPendingMeal());
        setPostedMealId(null);
        setOriginalImageBase64("");
        await clearMealId();
      } else {
        Alert.alert(t("common.error"), t("camera.update_failed"));
      }
    } catch (error) {
      console.error("💥 Update error:", error);
      Alert.alert(t("common.error"), t("camera.update_failed"));
    }
  };

  const handleDiscard = async () => {
    Alert.alert(t("camera.delete_analysis"), t("camera.delete_confirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("camera.discard"),
        style: "destructive",
        onPress: async () => {
          dispatch(clearPendingMeal());
          setPostedMealId(null);
          setOriginalImageBase64("");
          await clearMealId();
        },
      },
    ]);
  };

  const handleEditAnalysis = () => {
    setEditText("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) {
      Alert.alert(t("common.error"), t("camera.correction_required"));
      return;
    }

    try {
      setShowEditModal(false);
      await analyzeImageWithText(editText.trim());
      setEditText("");
    } catch (error) {
      console.error("💥 Edit analysis error:", error);
      Alert.alert(t("common.error"), t("camera.re_analysis_failed"));
    }
  };

  const handleEditIngredients = () => {
    const currentIngredients = pendingMeal?.analysis?.ingredients || [];
    const ingredientsText = currentIngredients
      .map((ing) => `${ing.name}`)
      .join(", ");
    setEditableIngredients(ingredientsText);
    setShowEditIngredientsModal(true);
  };

  const handleIngredientsSubmit = async () => {
    if (!editableIngredients.trim()) {
      Alert.alert(t("common.error"), t("camera.ingredients_required"));
      return;
    }

    try {
      setShowEditIngredientsModal(false);
      const updateText = `Please update the ingredients list to: ${editableIngredients.trim()}. Re-analyze the meal with these exact ingredients and provide updated nutritional information.`;
      await analyzeImageWithText(updateText);
      setEditableIngredients("");
    } catch (error) {
      console.error("💥 Edit ingredients error:", error);
      Alert.alert(t("common.error"), t("camera.re_analysis_failed"));
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#E8F5E8", "#F0FFF0"]}
          style={styles.permissionContainer}
        >
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconContainer}>
              <Ionicons name="camera" size={100} color="#4CAF50" />
            </View>
            <Text style={styles.permissionTitle}>{t("camera.permission")}</Text>
            <Text style={styles.permissionSubtitle}>
              {t("camera.description")}
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>{t("common.ok")}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isAnalyzing) {
      try {
        console.log("📸 Taking picture...");
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo && photo.base64) {
          console.log("✅ Picture taken, base64 length:", photo.base64.length);
          setShowCamera(false);
          await analyzeImage(photo.base64);
        } else {
          console.error("❌ No base64 data in photo");
          Alert.alert(t("common.error"), t("camera.analysis_failed"));
        }
      } catch (error) {
        console.error("💥 Camera error:", error);
        Alert.alert(t("common.error"), t("camera.analysis_failed"));
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <LinearGradient
            colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.8)"]}
            style={styles.cameraOverlay}
          >
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>{t("camera.take_picture")}</Text>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() =>
                  setFacing((current) =>
                    current === "back" ? "front" : "back"
                  )
                }
              >
                <Ionicons name="camera-reverse" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraCenter}>
              <View style={styles.focusFrame}>
                <View style={styles.focusCorner} />
                <View style={[styles.focusCorner, styles.focusCornerTR]} />
                <View style={[styles.focusCorner, styles.focusCornerBL]} />
                <View style={[styles.focusCorner, styles.focusCornerBR]} />
              </View>
              <Text style={styles.focusText}>
                {t("camera.tip_description")}
              </Text>
            </View>

            <View style={styles.cameraFooter}>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    isAnalyzing && styles.captureButtonDisabled,
                  ]}
                  onPress={takePicture}
                  disabled={isAnalyzing}
                >
                  <View style={styles.captureButtonOuter}>
                    <View style={styles.captureButtonInner} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </CameraView>
      </View>
    );
  }

  if (pendingMeal) {
    const isPosted = !!postedMealId;

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#E8F5E8", "#F0FFF0"]}
          style={styles.container}
        >
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.analysisContainer}>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: `data:image/jpeg;base64,${pendingMeal.image_base_64}`,
                  }}
                  style={styles.analyzedImage}
                  onError={(error) => {
                    console.error("💥 Image display error:", error);
                  }}
                />
                <View style={styles.imageOverlay}>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name={isPosted ? "checkmark-circle" : "analytics"}
                      size={16}
                      color="white"
                    />
                    <Text style={styles.statusBadgeText}>
                      {isPosted
                        ? t("camera.meal_saved")
                        : t("camera.meal_analyzed")}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text style={styles.analysisTitle}>
                    {isPosted
                      ? t("camera.meal_saved")
                      : t("camera.analysis_results")}
                  </Text>
                  <View style={styles.analysisSubtitle}>
                    <Ionicons name="restaurant" size={18} color="#4CAF50" />
                    <Text style={styles.mealName}>
                      {pendingMeal.analysis?.meal_name ||
                        pendingMeal.analysis?.description ||
                        t("camera.meal_name")}
                    </Text>
                  </View>
                  {/* Show indicator for estimated/fallback data */}
                  {(pendingMeal.analysis?.health_risk_notes?.includes(
                    "quota"
                  ) ||
                    pendingMeal.analysis?.health_risk_notes?.includes(
                      "estimated"
                    )) && (
                    <View style={styles.estimatedDataBadge}>
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color="#FF9800"
                      />
                      <Text style={styles.estimatedDataText}>
                        {t("camera.estimated_values")}
                      </Text>
                    </View>
                  )}
                </View>

                {pendingMeal.analysis?.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.mealDescription}>
                      {pendingMeal.analysis.description}
                    </Text>
                  </View>
                )}

                <View style={styles.nutritionContainer}>
                  <Text style={styles.nutritionTitle}>
                    {t("camera.nutritional_info")}
                  </Text>
                  <View style={styles.nutritionGrid}>
                    <View style={[styles.nutritionItem, styles.caloriesItem]}>
                      <Ionicons name="flame" size={24} color="#FF6B35" />
                      <Text style={styles.nutritionValue}>
                        {Math.round(pendingMeal.analysis?.calories || 0)}
                      </Text>
                      <Text style={styles.nutritionLabel}>
                        {t("meals.calories")}
                      </Text>
                    </View>
                    <View style={[styles.nutritionItem, styles.proteinItem]}>
                      <Ionicons name="barbell" size={24} color="#4CAF50" />
                      <Text style={styles.nutritionValue}>
                        {Math.round(pendingMeal.analysis?.protein_g || 0)}g
                      </Text>
                      <Text style={styles.nutritionLabel}>
                        {t("meals.protein")}
                      </Text>
                    </View>
                    <View style={[styles.nutritionItem, styles.carbsItem]}>
                      <Ionicons name="leaf" size={24} color="#2196F3" />
                      <Text style={styles.nutritionValue}>
                        {Math.round(pendingMeal.analysis?.carbs_g || 0)}g
                      </Text>
                      <Text style={styles.nutritionLabel}>
                        {t("meals.carbs")}
                      </Text>
                    </View>
                    <View style={[styles.nutritionItem, styles.fatsItem]}>
                      <Ionicons name="water" size={24} color="#FFC107" />
                      <Text style={styles.nutritionValue}>
                        {Math.round(pendingMeal.analysis?.fats_g || 0)}g
                      </Text>
                      <Text style={styles.nutritionLabel}>
                        {t("meals.fat")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Enhanced Ingredients Display */}
                {pendingMeal.analysis?.ingredients &&
                  pendingMeal.analysis.ingredients.length > 0 && (
                    <View style={styles.ingredientsContainer}>
                      <View style={styles.ingredientsHeader}>
                        <Ionicons
                          name="restaurant-outline"
                          size={20}
                          color="#4CAF50"
                        />
                        <Text style={styles.ingredientsTitle}>
                          {t("camera.identified_ingredients")}
                        </Text>
                        <TouchableOpacity
                          style={styles.editIngredientsButton}
                          onPress={() => setShowEditIngredientsModal(true)}
                          disabled={isEditingAnalysis}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color="#4CAF50"
                          />
                          <Text style={styles.editIngredientsText}>
                            {t("camera.edit_ingredients")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.ingredientsScrollView}
                      >
                        {pendingMeal.analysis.ingredients.map(
                          (ingredient, index) => (
                            <View key={index} style={styles.ingredientCard}>
                              <View style={styles.ingredientIconWrapper}>
                                <View style={styles.ingredientIconContainer}>
                                  <Ionicons
                                    name={
                                      getIngredientIcon(ingredient.name) as any
                                    }
                                    size={24}
                                    color="#4CAF50"
                                  />
                                </View>
                                <Text
                                  style={styles.ingredientName}
                                  numberOfLines={2}
                                >
                                  {ingredient.name}
                                </Text>
                              </View>
                              <View style={styles.ingredientNutritionGrid}>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>
                                    {Math.round(ingredient.calories || 0)}
                                  </Text>
                                  <Text style={styles.nutritionUnit}>cal</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>
                                    {Math.round(
                                      ingredient.protein ||
                                        ingredient.protein ||
                                        0
                                    )}
                                    g
                                  </Text>
                                  <Text style={styles.nutritionUnit}>
                                    protein
                                  </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>
                                    {Math.round(
                                      ingredient.carbs || ingredient.carbs || 0
                                    )}
                                    g
                                  </Text>
                                  <Text style={styles.nutritionUnit}>
                                    carbs
                                  </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>
                                    {Math.round(
                                      ingredient.fat || ingredient.fat || 0
                                    )}
                                    g
                                  </Text>
                                  <Text style={styles.nutritionUnit}>fat</Text>
                                </View>
                              </View>
                            </View>
                          )
                        )}
                      </ScrollView>
                    </View>
                  )}

                {/* Additional Nutritional Information */}
                {(pendingMeal.analysis?.fiber_g ||
                  pendingMeal.analysis?.sugar_g ||
                  pendingMeal.analysis?.sodium_g) && (
                  <View style={styles.additionalNutrition}>
                    <View style={styles.additionalNutritionHeader}>
                      <Ionicons
                        name="analytics-outline"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.additionalNutritionTitle}>
                        {t("camera.additional_info")}
                      </Text>
                    </View>
                    <View style={styles.additionalNutritionGrid}>
                      {pendingMeal.analysis.fiber_g && (
                        <View style={styles.additionalNutritionItem}>
                          <Ionicons
                            name="leaf-outline"
                            size={16}
                            color="#4CAF50"
                          />
                          <Text style={styles.additionalNutritionText}>
                            {t("camera.fiber")}:{" "}
                            {Math.round(pendingMeal.analysis.fiber_g)}g
                          </Text>
                        </View>
                      )}
                      {pendingMeal.analysis.sugar_g && (
                        <View style={styles.additionalNutritionItem}>
                          <Ionicons
                            name="cafe-outline"
                            size={16}
                            color="#FF9800"
                          />
                          <Text style={styles.additionalNutritionText}>
                            {t("camera.sugar")}:{" "}
                            {Math.round(pendingMeal.analysis.sugar_g)}g
                          </Text>
                        </View>
                      )}
                      {pendingMeal.analysis.sodium_g && (
                        <View style={styles.additionalNutritionItem}>
                          <Ionicons
                            name="water-outline"
                            size={16}
                            color="#2196F3"
                          />
                          <Text style={styles.additionalNutritionText}>
                            {t("camera.sodium")}:{" "}
                            {Math.round(pendingMeal.analysis.sodium_g)}mg
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.discardButton]}
                  onPress={handleDiscard}
                  disabled={isPosting || isUpdating || isEditingAnalysis}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                  <Text style={styles.discardButtonText}>
                    {isPosted ? t("camera.clear") : t("camera.discard")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditAnalysis}
                  disabled={isPosting || isUpdating || isEditingAnalysis}
                >
                  {isEditingAnalysis ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="create-outline" size={20} color="white" />
                      <Text style={styles.editButtonText}>
                        {t("camera.edit_analysis")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {!isPosted ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.postButton]}
                    onPress={handlePost}
                    disabled={isPosting || isUpdating || isEditingAnalysis}
                  >
                    {isPosting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.postButtonText}>
                          {t("camera.save_meal")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.updateButton]}
                    onPress={handleUpdate}
                    disabled={isPosting || isUpdating || isEditingAnalysis}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="refresh-outline"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.updateButtonText}>
                          {t("camera.update_analysis")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Update Modal */}
            <Modal
              visible={showUpdateModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowUpdateModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {t("camera.update_analysis")}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowUpdateModal(false)}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    {t("camera.add_additional_info")}
                  </Text>

                  <TextInput
                    style={styles.updateInput}
                    placeholder={t("camera.enter_update")}
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
                      onPress={() => setShowUpdateModal(false)}
                      disabled={isUpdating}
                    >
                      <Text style={styles.cancelButtonText}>
                        {t("common.cancel")}
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
                          {t("common.update")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Edit Analysis Modal */}
            <Modal
              visible={showEditModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowEditModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {t("camera.edit_analysis")}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowEditModal(false)}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    {t("camera.add_correction")}
                  </Text>

                  <TextInput
                    style={styles.updateInput}
                    placeholder={t("camera.enter_correction")}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoFocus={true}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowEditModal(false)}
                      disabled={isEditingAnalysis}
                    >
                      <Text style={styles.cancelButtonText}>
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleEditSubmit}
                      disabled={!editText.trim() || isEditingAnalysis}
                    >
                      {isEditingAnalysis ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {t("camera.re_analyze")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Edit Ingredients Modal */}
            <Modal
              visible={showEditIngredientsModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowEditIngredientsModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {t("camera.edit_ingredients")}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowEditIngredientsModal(false)}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSubtitle}>
                    {t("camera.edit_ingredients_description")}
                  </Text>

                  <TextInput
                    style={styles.updateInput}
                    placeholder={t("camera.enter_ingredients_list")}
                    value={editableIngredients}
                    onChangeText={setEditableIngredients}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    autoFocus={true}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowEditIngredientsModal(false)}
                      disabled={isEditingAnalysis}
                    >
                      <Text style={styles.cancelButtonText}>
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleIngredientsSubmit}
                      disabled={
                        !editableIngredients.trim() || isEditingAnalysis
                      }
                    >
                      {isEditingAnalysis ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {t("camera.re_analyze")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#E8F5E8", "#F0FFF0"]} style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{t("camera.smart_analysis")}</Text>
            <Text style={styles.subtitle}>{t("camera.analysis_subtitle")}</Text>
          </View>
        </View>

        {(isAnalyzing || isEditingAnalysis) && (
          <View style={styles.analyzingContainer}>
            <View style={styles.analyzingCard}>
              <View style={styles.analyzingIconContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
              <Text style={styles.analyzingTitle}>
                {isEditingAnalysis
                  ? t("camera.updating_analysis")
                  : t("camera.analyzing_title")}
              </Text>
              <Text style={styles.analyzingSubtext}>
                {t("camera.analyzing_subtitle")}
              </Text>
              <View style={styles.analyzingProgress}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
            ]}
            onPress={() => setShowCamera(true)}
            disabled={isAnalyzing || isEditingAnalysis}
          >
            <LinearGradient
              colors={["#4CAF50", "#45A049"]}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="camera" size={32} color="white" />
                <Text style={styles.buttonText}>
                  {t("camera.take_picture")}
                </Text>
                <Text style={styles.buttonSubtext}>
                  {t("camera.open_camera")}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
            ]}
            onPress={pickImage}
            disabled={isAnalyzing || isEditingAnalysis}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="images" size={32} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>
                {t("camera.choose_gallery")}
              </Text>
              <Text style={styles.secondaryButtonSubtext}>
                {t("camera.upload_existing")}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={24} color="#4CAF50" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{t("camera.optimal_results")}</Text>
              <Text style={styles.tipText}>{t("camera.tip_description")}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  cameraTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  cameraCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  focusFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  focusCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "white",
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  focusCornerTR: {
    transform: [{ rotate: "90deg" }],
    top: 0,
    right: 0,
    left: "auto",
  },
  focusCornerBL: {
    transform: [{ rotate: "-90deg" }],
    bottom: 0,
    left: 0,
    top: "auto",
  },
  focusCornerBR: {
    transform: [{ rotate: "180deg" }],
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
  },
  focusText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
    opacity: 0.8,
  },
  cameraFooter: {
    paddingBottom: 40,
  },
  cameraControls: {
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 320,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  permissionSubtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#2E7D32",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#4CAF50",
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#E8F5E8",
  },
  buttonGradient: {
    padding: 25,
    alignItems: "center",
  },
  buttonContent: {
    alignItems: "center",
    padding: 25,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  buttonSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 5,
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  secondaryButtonSubtext: {
    color: "#81C784",
    fontSize: 14,
    marginTop: 5,
  },
  tipCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: "#4CAF50",
    lineHeight: 20,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  analyzingCard: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  analyzingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 10,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  analyzingProgress: {
    width: "100%",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#E8F5E8",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    width: "70%",
    borderRadius: 2,
  },
  analysisContainer: {
    padding: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  analyzedImage: {
    width: "100%",
    height: 280,
    borderRadius: 20,
  },
  imageOverlay: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  analysisCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  analysisHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  analysisSubtitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 8,
  },
  descriptionContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  mealDescription: {
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
  },
  nutritionContainer: {
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#E8F5E8",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  caloriesItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  proteinItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  carbsItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  fatsItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
    fontWeight: "500",
  },
  ingredientsContainer: {
    backgroundColor: "#E8F5E8",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "center",
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  ingredientCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ingredientIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    flex: 1,
  },
  ingredientNutrition: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ingredientDetail: {
    alignItems: "center",
    flex: 1,
  },
  ingredientDetailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  ingredientDetailLabel: {
    fontSize: 10,
    color: "#81C784",
    marginTop: 2,
  },
  additionalNutrition: {
    backgroundColor: "#E8F5E8",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  additionalNutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "center",
  },
  additionalNutritionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 8,
  },
  additionalNutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  additionalNutritionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  additionalNutritionText: {
    fontSize: 12,
    color: "#2E7D32",
    marginLeft: 8,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    minHeight: 56,
  },
  discardButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#F44336",
  },
  editButton: {
    backgroundColor: "#FF9800",
  },
  updateButton: {
    backgroundColor: "#2196F3",
  },
  postButton: {
    backgroundColor: "#4CAF50",
  },
  discardButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  updateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  postButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
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
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E8",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#4CAF50",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  updateInput: {
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
    marginHorizontal: 20,
    textAlignVertical: "top",
    backgroundColor: "#E8F5E8",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
    minHeight: 50,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  estimatedDataBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  estimatedDataText: {
    color: "#FF9800",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  editIngredientsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  editIngredientsText: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  ingredientsScrollView: {
    marginTop: 10,
  },
  ingredientIconWrapper: {
    alignItems: "center",
    marginBottom: 8,
  },
  ingredientNutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionUnit: {
    fontSize: 10,
    color: "#4CAF50",
    marginTop: 1,
  },
});
