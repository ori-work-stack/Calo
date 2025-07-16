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

  // Legacy states (keeping for compatibility)
  const [isEditing, setIsEditing] = useState(false);
  const [editedComponents, setEditedComponents] = useState<string>("");
  const [originalAnalysis, setOriginalAnalysis] = useState<string>("");

  // Load pending meal on component mount
  useEffect(() => {
    dispatch(loadPendingMeal());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
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

  // Load saved analysis on component mount
  useEffect(() => {
    loadSavedAnalysis();
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

  const loadSavedAnalysis = async () => {
    try {
      const savedData = await AsyncStorage.getItem("lastImageAnalysis");
      if (savedData) {
        const {
          analysis: savedAnalysis,
          userNotes: savedNotes,
          image: savedImage,
        } = JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error);
    }
  };

  const saveAnalysisData = async (
    analysisText: string,
    notes: string,
    imageUri: string
  ) => {
    try {
      const dataToSave = {
        analysis: analysisText,
        userNotes: notes,
        image: imageUri,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        "lastImageAnalysis",
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error("Error saving analysis:", error);
    }
  };

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

  const analyzeImage = async (base64Image: string) => {
    try {
      console.log("🔍 Analyzing image...");
      setPostedMealId(null); // Reset posted meal ID
      await clearMealId(); // Clear persisted meal ID

      // Save analysis data to AsyncStorage
      await saveAnalysisData(base64Image, "", base64Image);

      dispatch(analyzeMeal(base64Image));
    } catch (error) {
      console.error("💥 Analysis error:", error);
      Alert.alert("Error", "Failed to analyze image");
    }
  };

  const analyzeImageWithText = async (
    base64Image: string,
    additionalText: string
  ) => {
    try {
      console.log("🔍 Re-analyzing image with additional text...");
      setIsEditingAnalysis(true);

      // Create a prompt that includes the additional text
      const enhancedPrompt = `${additionalText}`;

      // Save analysis data to AsyncStorage
      await saveAnalysisData(base64Image, additionalText, base64Image);

      // You might need to modify your analyzeMeal action to accept additional text
      // For now, we'll dispatch with the base64 image and handle the text separately
      dispatch(analyzeMeal(base64Image, enhancedPrompt));
    } catch (error) {
      console.error("💥 Analysis error:", error);
      Alert.alert("Error", "Failed to re-analyze image");
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
          Alert.alert(
            "Error",
            "Failed to process the selected image. Please try a different image."
          );
        }
      } else {
        console.log("📱 User canceled image selection");
      }
    } catch (error) {
      console.error("💥 Error in pickImage:", error);
      Alert.alert("Error", "Failed to open photo library. Please try again.");
    }
  };

  console.log(pendingMeal?.analysis?.ingredients, "this are ing for this meal");

  const handlePost = async () => {
    if (pendingMeal && !isPosting) {
      console.log("📤 Posting meal...");
      const result = await dispatch(postMeal());

      console.log("📤 Post result:", result);

      if (postMeal.fulfilled.match(result)) {
        // Extract meal ID from the response - try multiple possible fields
        const mealId = result.payload?.meal_id?.toString();

        console.log("✅ Meal posted successfully with ID:", mealId);
        console.log(
          "✅ Full payload:",
          JSON.stringify(result.payload, null, 2)
        );

        if (mealId) {
          setPostedMealId(mealId);
          await saveMealId(mealId); // Persist the meal ID

          Alert.alert(
            "Success",
            "Meal posted successfully! You can now update it if needed."
          );
        } else {
          console.warn("⚠️ Meal posted but no ID returned");
          console.warn(
            "⚠️ Available payload keys:",
            Object.keys(result.payload || {})
          );

          // Set a temporary ID to allow updates to work
          const tempId = "temp_" + Date.now();
          setPostedMealId(tempId);
          await saveMealId(tempId);

          Alert.alert(
            "Success",
            "Meal posted successfully! Update functionality is available."
          );
        }
      } else {
        console.error("❌ Meal post failed:", result.payload);
        Alert.alert(
          "Error",
          "Failed to post meal: " + (result.payload || "Unknown error")
        );
      }
    }
  };

  const handleUpdate = () => {
    console.log("🔄 Update button pressed. Posted meal ID:", postedMealId);
    console.log("🔄 Pending meal exists:", !!pendingMeal);

    if (!postedMealId) {
      console.log("❌ No posted meal ID found");
      Alert.alert(
        "Post Required",
        "Please post the meal first before updating it.",
        [{ text: "OK" }]
      );
      return;
    }

    console.log("✅ Opening update modal");
    setShowUpdateModal(true);
    setUpdateText(""); // Reset update text when opening modal
  };

  const handleUpdateSubmit = async () => {
    if (!postedMealId) {
      Alert.alert("Error", "Cannot update - no meal ID found");
      return;
    }

    if (!updateText.trim()) {
      Alert.alert("Error", "Please enter update text");
      return;
    }

    try {
      console.log("🔄 Submitting update with text:", updateText.trim());
      console.log("🆔 Meal ID:", postedMealId);

      const result = await dispatch(
        updateMeal({
          meal_id: postedMealId,
          updateText: updateText.trim(),
        })
      );

      if (updateMeal.fulfilled.match(result)) {
        console.log("✅ Update successful:", result.payload);

        Alert.alert("Success", "Meal updated successfully!");

        // Close modal and reset state
        setShowUpdateModal(false);
        setUpdateText("");

        // Clear the pending meal and posted meal ID
        dispatch(clearPendingMeal());
        setPostedMealId(null);
        await clearMealId();
      } else {
        console.error("❌ Update failed:", result.payload);
        const errorMessage =
          result.payload?.message ||
          result.payload?.error ||
          result.payload ||
          "Unknown error";

        Alert.alert("Error", "Failed to update meal: " + errorMessage);
      }
    } catch (error) {
      console.error("💥 Update error:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while updating the meal"
      );
    }
  };

  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
    setUpdateText("");
  };

  const handleDiscard = async () => {
    Alert.alert(
      "Discard Analysis",
      "Are you sure you want to discard this analysis?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            dispatch(clearPendingMeal());
            setPostedMealId(null);
            await clearMealId();
          },
        },
      ]
    );
  };

  const resetCamera = async () => {
    dispatch(clearPendingMeal());
    setPostedMealId(null);
    await clearMealId();
    await AsyncStorage.removeItem("lastImageAnalysis");
  };

  // Fixed handleEditAnalysis function
  const handleEditAnalysis = () => {
    console.log("🔄 Edit analysis button pressed");
    setEditText(""); // Reset edit text
    setShowEditModal(true);
  };

  // Handle edit analysis submission
  const handleEditSubmit = async () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Please enter correction text");
      return;
    }

    if (!pendingMeal?.image_base_64) {
      Alert.alert("Error", "No image found to re-analyze");
      return;
    }

    try {
      console.log("🔄 Submitting edit with text:", editText.trim());

      // Close modal first
      setShowEditModal(false);

      // Re-analyze the image with the additional text
      await analyzeImageWithText(pendingMeal.image_base_64, editText.trim());

      // Reset edit text
      setEditText("");
    } catch (error) {
      console.error("💥 Edit analysis error:", error);
      Alert.alert("Error", "Failed to re-analyze image");
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditText("");
  };

  // Legacy confirmEdit function (keeping for compatibility)
  const confirmEdit = async () => {
    try {
      if (editedComponents.trim() && originalAnalysis) {
        // Create updated prompt for re-analysis
        const updatePrompt = `התמונה נותחה בעבר וכללה: ${originalAnalysis}. המשתמש עדכן את הרכב המנה ל: ${editedComponents}. אנא בצע ניתוח קלורי מחדש.`;

        // Save updated analysis data
        await saveAnalysisData(
          originalAnalysis,
          editedComponents,
          pendingMeal?.image_base_64 || ""
        );

        Alert.alert("הצלחה", "הניתוח עודכן בהצלחה");
      }
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating analysis:", error);
      Alert.alert("שגיאה", "לא הצלחנו לעדכן את הניתוח");
    }
  };

  const deleteAndRetake = () => {
    Alert.alert(
      "מחיקת תמונה",
      "האם אתה בטוח שברצונך למחוק את התמונה ולצלם מחדש?",
      [
        { text: "ביטול", style: "cancel" },
        { text: "מחק וצלם מחדש", onPress: resetCamera },
      ]
    );
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t(`camera.permission`)}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
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
          Alert.alert("Error", "Failed to capture image data");
        }
      } catch (error) {
        console.error("💥 Camera error:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
              onPress={() =>
                setFacing((current) => (current === "back" ? "front" : "back"))
              }
              activeOpacity={0.7}
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isAnalyzing}
              activeOpacity={0.7}
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
    console.log(
      "🔍 Rendering pending meal. Posted:",
      isPosted,
      "ID:",
      postedMealId
    );

    return (
      <ScrollView style={styles.container}>
        <View style={styles.analysisContainer}>
          <Image
            source={{
              uri: `data:image/jpeg;base64,${pendingMeal.image_base_64}`,
            }}
            style={styles.analyzedImage}
            onError={(error) => {
              console.error("💥 Image display error:", error);
              console.error(
                "💥 Image URI:",
                `data:image/jpeg;base64,${pendingMeal.image_base_64?.substring(
                  0,
                  50
                )}...`
              );
            }}
            onLoad={() => {
              console.log("✅ Image loaded successfully");
            }}
          />

          <View style={styles.analysisResults}>
            <Text style={styles.analysisTitle}>
              {isPosted ? "Posted Meal" : "Analysis Results"}
            </Text>

            <Text style={styles.mealName}>
              {pendingMeal.analysis?.meal_name ||
                pendingMeal.analysis?.description ||
                "Unknown Meal"}
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
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(pendingMeal.analysis?.protein_g || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(pendingMeal.analysis?.carbs_g || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(pendingMeal.analysis?.fats_g || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>

            {pendingMeal.analysis?.ingredients &&
              pendingMeal.analysis.ingredients.length > 0 && (
                <View style={styles.ingredientsContainer}>
                  <Text style={styles.ingredientsTitle}>
                    Ingredients Breakdown
                  </Text>
                  {pendingMeal.analysis.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>
                        🥗 {ingredient.name}
                      </Text>
                      <View style={styles.ingredientNutrition}>
                        <Text style={styles.ingredientDetail}>
                          Calories: {Math.round(ingredient.calories)}
                        </Text>
                        <Text style={styles.ingredientDetail}>
                          Protein: {Math.round(ingredient.protein)}g
                        </Text>
                        <Text style={styles.ingredientDetail}>
                          Carbs: {Math.round(ingredient.carbs)}g
                        </Text>
                        <Text style={styles.ingredientDetail}>
                          Fat: {Math.round(ingredient.fat)}g
                        </Text>
                        {ingredient.fiber && (
                          <Text style={styles.ingredientDetail}>
                            Fiber: {Math.round(ingredient.fiber)}g
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

            {isPosted && (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                <Text style={styles.statusText}>Meal saved successfully!</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.discardButton]}
              onPress={handleDiscard}
              disabled={isPosting || isUpdating || isEditingAnalysis}
              activeOpacity={0.7}
            >
              <Text style={styles.discardButtonText}>
                {isPosted ? "Clear" : "Discard"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#FF9500" }]}
              onPress={handleEditAnalysis}
              disabled={isPosting || isUpdating || isEditingAnalysis}
              activeOpacity={0.7}
            >
              {isEditingAnalysis ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={[styles.actionButtonText, { color: "white" }]}>
                  ערוך ניתוח
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#FF3B30" }]}
              onPress={deleteAndRetake}
              disabled={isPosting || isUpdating || isEditingAnalysis}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: "white" }]}>
                מחק וצלם מחדש
              </Text>
            </TouchableOpacity>

            {!isPosted ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.postButton]}
                onPress={handlePost}
                disabled={isPosting || isUpdating || isEditingAnalysis}
                activeOpacity={0.7}
              >
                {isPosting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.postButtonText}>Post Meal</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => {
                  handleUpdate();
                }}
                disabled={isPosting || isUpdating || isEditingAnalysis}
                activeOpacity={0.7}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Analysis</Text>
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
          onRequestClose={handleUpdateCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Meal</Text>
              <Text style={styles.modalSubtitle}>
                Add additional information about your meal (e.g., "I also ate 2
                pieces of bread")
              </Text>

              <TextInput
                style={styles.updateInput}
                placeholder="Enter additional meal information..."
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
                  onPress={handleUpdateCancel}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleUpdateSubmit}
                  disabled={!updateText.trim() || isUpdating}
                  activeOpacity={0.7}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update</Text>
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
          onRequestClose={handleEditCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ערוך ניתוח</Text>
              <Text style={styles.modalSubtitle}>
                הוסף מידע או תיקון לגבי הארוחה (לדוגמה: "יש גם 2 פרוסות לחם" או
                "בלי אורז")
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
                  onPress={handleEditCancel}
                  disabled={isEditingAnalysis}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleEditSubmit}
                  disabled={!editText.trim() || isEditingAnalysis}
                  activeOpacity={0.7}
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>{t(`camera.analyze_photo`)}</Text>
        <Text style={styles.subtitle}>{t(`camera.description`)}</Text>
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
            styles.cameraButton,
            (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
          ]}
          onPress={() => setShowCamera(true)}
          disabled={isAnalyzing || isEditingAnalysis}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="camera" size={32} color="white" />
          </View>
          <Text style={styles.buttonText}>{t(`camera.take_photo`)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.galleryButton,
            (isAnalyzing || isEditingAnalysis) && styles.buttonDisabled,
          ]}
          onPress={() => {
            console.log("🔘 Gallery button pressed!");
            pickImage();
          }}
          disabled={isAnalyzing || isEditingAnalysis}
          activeOpacity={0.7}
        >
          <View style={styles.buttonIconContainer}>
            <Ionicons name="images" size={32} color="#007AFF" />
          </View>
          <Text style={styles.galleryButtonText}>
            {t(`camera.choose_from_gallery`)}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color="#FF9500" />
          <Text style={styles.tipText}>
            💡 לתוצאות מיטביות, וודא שהאוכל מוצג בבירור ובתאורה טובה
          </Text>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelButton}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>ערוך רכיבי המנה</Text>
            <TouchableOpacity onPress={confirmEdit}>
              <Text style={styles.modalConfirmButton}>אשר</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>ניתוח מקורי:</Text>
            <Text style={styles.originalAnalysisText}>{originalAnalysis}</Text>

            <Text style={styles.modalLabel}>רכיבים מעודכנים:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editedComponents}
              onChangeText={setEditedComponents}
              multiline
              placeholder="ערוך את רכיבי המנה..."
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  closeButton: {
    padding: 10,
  },
  flipButton: {
    padding: 10,
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
  headerSection: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: "#f8f9fa",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    margin: 20,
  },
  cameraButton: {
    backgroundColor: "#007AFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "column",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  galleryButton: {
    borderWidth: 2,
    borderColor: "#007AFF",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: 100,
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
    textAlign: "center",
  },
  galleryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  tipCard: {
    backgroundColor: "#fff8e1",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
    marginTop: 10,
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
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisResults: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  mealName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  mealDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    padding: 10,
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
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 45,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  discardButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dc3545",
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
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
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
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
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
  ingredientsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  ingredientItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  ingredientNutrition: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientDetail: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCancelButton: {
    color: "#007AFF",
    fontSize: 16,
  },
  modalConfirmButton: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
  originalAnalysisText: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    lineHeight: 20,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    minHeight: 200,
    fontSize: 16,
    textAlignVertical: "top",
  },
});
