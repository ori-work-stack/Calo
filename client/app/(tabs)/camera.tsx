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
import { t } from "i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [postedMealId, setPostedMealId] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Edit analysis modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);

  // Load pending meal on component mount
  useEffect(() => {
    dispatch(loadPendingMeal());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("שגיאה", error, [
        { text: "אישור", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

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

      const validatedBase64 = validateAndProcessImage(base64Image);
      if (!validatedBase64) {
        Alert.alert("שגיאה", "נתוני התמונה לא תקינים. אנא נסה שוב.");
        return;
      }

      setPostedMealId(null);
      await clearMealId();

      console.log("📤 Dispatching analyze meal action...");
      const result = await dispatch(analyzeMeal(validatedBase64));

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Analysis completed successfully");
      } else {
        console.error("❌ Analysis failed:", result.payload);
        Alert.alert("שגיאה", "ניתוח התמונה נכשל. אנא נסה שוב.");
      }
    } catch (error) {
      console.error("💥 Analysis error details:", error);
      Alert.alert("שגיאה", "שגיאה בניתוח התמונה");
    }
  };

  const analyzeImageWithText = async (
    base64Image: string,
    additionalText: string
  ) => {
    try {
      console.log("🔍 Re-analyzing image with additional text...");
      setIsEditingAnalysis(true);

      const validatedBase64 = validateAndProcessImage(base64Image);
      if (!validatedBase64) {
        Alert.alert("שגיאה", "נתוני התמונה לא תקינים.");
        return;
      }

      const result = await dispatch(
        analyzeMeal(validatedBase64, additionalText)
      );

      if (analyzeMeal.fulfilled.match(result)) {
        console.log("✅ Re-analysis completed successfully");
      } else {
        console.error("❌ Re-analysis failed:", result.payload);
        Alert.alert("שגיאה", "ניתוח מחדש נכשל. אנא נסה שוב.");
      }
    } catch (error) {
      console.error("💥 Re-analysis error:", error);
      Alert.alert("שגיאה", "שגיאה בניתוח מחדש");
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
          Alert.alert("שגיאה", "לא הצלחנו לעבד את התמונה שנבחרה.");
        }
      } else {
        console.log("📱 User canceled image selection");
      }
    } catch (error) {
      console.error("💥 Error in pickImage:", error);
      Alert.alert("שגיאה", "שגיאה בפתיחת גלריית התמונות.");
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
          Alert.alert("הצלחה", "הארוחה נשמרה בהצלחה!");
        } else {
          const tempId = "temp_" + Date.now();
          setPostedMealId(tempId);
          await saveMealId(tempId);
          Alert.alert("הצלחה", "הארוחה נשמרה בהצלחה!");
        }
      } else {
        console.error("❌ Meal post failed:", result.payload);
        Alert.alert("שגיאה", "שמירת הארוחה נכשלה");
      }
    }
  };

  const handleUpdate = () => {
    if (!postedMealId) {
      Alert.alert("נדרש שמירה", "אנא שמור את הארוחה לפני עדכון.", [
        { text: "אישור" },
      ]);
      return;
    }
    setShowUpdateModal(true);
    setUpdateText("");
  };

  const handleUpdateSubmit = async () => {
    if (!postedMealId || !updateText.trim()) {
      Alert.alert("שגיאה", "אנא הכנס טקסט עדכון");
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
        Alert.alert("הצלחה", "הארוחה עודכנה בהצלחה!");
        setShowUpdateModal(false);
        setUpdateText("");
        dispatch(clearPendingMeal());
        setPostedMealId(null);
        await clearMealId();
      } else {
        Alert.alert("שגיאה", "עדכון הארוחה נכשל");
      }
    } catch (error) {
      console.error("💥 Update error:", error);
      Alert.alert("שגיאה", "שגיאה בעדכון הארוחה");
    }
  };

  const handleDiscard = async () => {
    Alert.alert("מחיקת ניתוח", "האם אתה בטוח שברצונך למחוק את הניתוח?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        style: "destructive",
        onPress: async () => {
          dispatch(clearPendingMeal());
          setPostedMealId(null);
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
      Alert.alert("שגיאה", "אנא הכנס טקסט תיקון");
      return;
    }

    if (!pendingMeal?.image_base_64) {
      Alert.alert("שגיאה", "לא נמצאה תמונה לניתוח מחדש");
      return;
    }

    try {
      setShowEditModal(false);
      await analyzeImageWithText(pendingMeal.image_base_64, editText.trim());
      setEditText("");
    } catch (error) {
      console.error("💥 Edit analysis error:", error);
      Alert.alert("שגיאה", "ניתוח מחדש נכשל");
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={80} color="#666" />
          <Text style={styles.permissionText}>נדרשת הרשאה למצלמה</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>מתן הרשאה</Text>
          </TouchableOpacity>
        </View>
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
          Alert.alert("שגיאה", "לא הצלחנו לצלם תמונה");
        }
      } catch (error) {
        console.error("💥 Camera error:", error);
        Alert.alert("שגיאה", "שגיאה בצילום");
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() =>
                setFacing((current) => (current === "back" ? "front" : "back"))
              }
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isAnalyzing}
            >
              <View
                style={[
                  styles.captureButtonInner,
                  isAnalyzing && styles.captureButtonDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (pendingMeal) {
    const isPosted = !!postedMealId;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.analysisContainer}>
            <Image
              source={{
                uri: `data:image/jpeg;base64,${pendingMeal.image_base_64}`,
              }}
              style={styles.analyzedImage}
              onError={(error) => {
                console.error("💥 Image display error:", error);
              }}
            />

            <View style={styles.analysisResults}>
              <Text style={styles.analysisTitle}>
                {isPosted ? "ארוחה שמורה" : "תוצאות ניתוח"}
              </Text>

              <Text style={styles.mealName}>
                {pendingMeal.analysis?.meal_name ||
                  pendingMeal.analysis?.description ||
                  "ארוחה לא ידועה"}
              </Text>

              {pendingMeal.analysis?.description && (
                <Text style={styles.mealDescription}>
                  {pendingMeal.analysis.description}
                </Text>
              )}

              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis?.calories || 0)}
                  </Text>
                  <Text style={styles.nutritionLabel}>קלוריות</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis?.protein_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>חלבון</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis?.carbs_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>פחמימות</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {Math.round(pendingMeal.analysis?.fats_g || 0)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>שומן</Text>
                </View>
              </View>

              {/* Enhanced Ingredients Display */}
              {pendingMeal.analysis?.ingredients &&
                pendingMeal.analysis.ingredients.length > 0 && (
                  <View style={styles.ingredientsContainer}>
                    <Text style={styles.ingredientsTitle}>פירוט רכיבים</Text>
                    {pendingMeal.analysis.ingredients.map(
                      (ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                          <Text style={styles.ingredientName}>
                            🥗 {ingredient.name}
                          </Text>
                          <View style={styles.ingredientNutrition}>
                            <Text style={styles.ingredientDetail}>
                              קלוריות: {Math.round(ingredient.calories || 0)}
                            </Text>
                            <Text style={styles.ingredientDetail}>
                              חלבון: {Math.round(ingredient.protein || 0)}g
                            </Text>
                            <Text style={styles.ingredientDetail}>
                              פחמימות: {Math.round(ingredient.carbs || 0)}g
                            </Text>
                            <Text style={styles.ingredientDetail}>
                              שומן: {Math.round(ingredient.fat || 0)}g
                            </Text>
                            {ingredient.fiber && (
                              <Text style={styles.ingredientDetail}>
                                סיבים: {Math.round(ingredient.fiber)}g
                              </Text>
                            )}
                            {ingredient.sugar && (
                              <Text style={styles.ingredientDetail}>
                                סוכר: {Math.round(ingredient.sugar)}g
                              </Text>
                            )}
                          </View>
                        </View>
                      )
                    )}
                  </View>
                )}

              {/* Additional Nutritional Information */}
              {(pendingMeal.analysis?.fiber_g ||
                pendingMeal.analysis?.sugar_g ||
                pendingMeal.analysis?.sodium_g) && (
                <View style={styles.additionalNutrition}>
                  <Text style={styles.additionalNutritionTitle}>
                    מידע תזונתי נוסף
                  </Text>
                  <View style={styles.nutritionRow}>
                    {pendingMeal.analysis.fiber_g && (
                      <Text style={styles.nutritionInfo}>
                        סיבים: {Math.round(pendingMeal.analysis.fiber_g)}g
                      </Text>
                    )}
                    {pendingMeal.analysis.sugar_g && (
                      <Text style={styles.nutritionInfo}>
                        סוכר: {Math.round(pendingMeal.analysis.sugar_g)}g
                      </Text>
                    )}
                    {pendingMeal.analysis.sodium_g && (
                      <Text style={styles.nutritionInfo}>
                        נתרן: {Math.round(pendingMeal.analysis.sodium_g)}mg
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {isPosted && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.statusText}>הארוחה נשמרה בהצלחה!</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.discardButton]}
                onPress={handleDiscard}
                disabled={isPosting || isUpdating || isEditingAnalysis}
              >
                <Text style={styles.discardButtonText}>
                  {isPosted ? "נקה" : "מחק"}
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
                  <Text style={styles.editButtonText}>ערוך ניתוח</Text>
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
                    <Text style={styles.postButtonText}>שמור ארוחה</Text>
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
                    <Text style={styles.updateButtonText}>עדכן ניתוח</Text>
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
                <Text style={styles.modalTitle}>עדכן ארוחה</Text>
                <Text style={styles.modalSubtitle}>
                  הוסף מידע נוסף על הארוחה שלך
                </Text>

                <TextInput
                  style={styles.updateInput}
                  placeholder="הכנס מידע נוסף על הארוחה..."
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
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleUpdateSubmit}
                    disabled={!updateText.trim() || isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>עדכן</Text>
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
                <Text style={styles.modalTitle}>ערוך ניתוח</Text>
                <Text style={styles.modalSubtitle}>
                  הוסף מידע או תיקון לגבי הארוחה
                </Text>

                <TextInput
                  style={styles.updateInput}
                  placeholder="הזן תיקון או מידע נוסף על הארוחה..."
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
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleEditSubmit}
                    disabled={!editText.trim() || isEditingAnalysis}
                  >
                    {isEditingAnalysis ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>נתח מחדש</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>ניתוח תזונתי</Text>
        <Text style={styles.subtitle}>
          צלם או בחר תמונה לניתוח תזונתי מדויק
        </Text>
      </View>

      {(isAnalyzing || isEditingAnalysis) && (
        <View style={styles.analyzingContainer}>
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.analyzingText}>
              {isEditingAnalysis ? "מעדכן ניתוח..." : "מנתח את הארוחה שלך..."}
            </Text>
            <Text style={styles.analyzingSubtext}>זה עלול לקחת כמה שניות</Text>
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
          <View style={styles.buttonIconContainer}>
            <Ionicons name="camera" size={32} color="white" />
          </View>
          <Text style={styles.buttonText}>צלם תמונה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
          ]}
          onPress={pickImage}
          disabled={isAnalyzing || isEditingAnalysis}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="images" size={32} color="#007AFF" />
          </View>
          <Text style={styles.secondaryButtonText}>בחר מהגלריה</Text>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color="#FF9500" />
          <Text style={styles.tipText}>
            💡 לתוצאות מיטביות, וודא שהאוכל מוצג בבירור ובתאורה טובה
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  cameraControls: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  captureButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
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
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainButton: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonIconContainer: {
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  tipCard: {
    backgroundColor: "#fff8e1",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    lineHeight: 20,
    textAlign: "right",
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  analyzingCard: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
    maxWidth: 300,
  },
  analyzingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  analyzingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  analysisContainer: {
    padding: 20,
  },
  analyzedImage: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  analysisResults: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  mealName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  mealDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontWeight: "500",
  },
  ingredientsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  ingredientItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  ingredientNutrition: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientDetail: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  additionalNutrition: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  additionalNutritionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  nutritionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  nutritionInfo: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 12,
    backgroundColor: "#d4edda",
    borderRadius: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#155724",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  discardButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#dc3545",
  },
  editButton: {
    backgroundColor: "#FF9500",
  },
  updateButton: {
    backgroundColor: "#ffc107",
  },
  postButton: {
    backgroundColor: "#28a745",
  },
  discardButtonText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "bold",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  updateButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  postButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
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
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  updateInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
    textAlignVertical: "top",
    backgroundColor: "#f8f9fa",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});
