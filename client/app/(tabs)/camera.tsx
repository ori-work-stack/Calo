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
  setPendingMealForUpdate,
} from "@/src/store/mealSlice";
import { Ionicons } from "@expo/vector-icons";

export default function CameraScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { pendingMeal, isAnalyzing, isPosting, isUpdating, error } =
    useSelector((state: RootState) => state.meal);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const cameraRef = useRef<CameraView>(null);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
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
          console.log("✅ Picture taken, analyzing...");
          setShowCamera(false);
          dispatch(analyzeMeal(photo.base64));
        } else {
          Alert.alert("Error", "Failed to capture image data");
        }
      } catch (error) {
        console.error("💥 Camera error:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const pickImage = async () => {
    if (isAnalyzing) return;

    try {
      console.log("🖼️ Opening image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log("✅ Image selected, processing...");

        if (asset.base64) {
          dispatch(analyzeMeal(asset.base64));
        } else {
          Alert.alert("Error", "Failed to process selected image");
        }
      }
    } catch (error) {
      console.error("💥 Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handlePost = async () => {
    if (pendingMeal && !isPosting) {
      const result = await dispatch(postMeal());
      if (postMeal.fulfilled.match(result)) {
        Alert.alert("Success", "Meal posted successfully!");
      }
    }
  };

  const handleUpdate = () => {
    setShowUpdateModal(true);
    setUpdateText(""); // Reset update text when opening modal
  };

  const handleUpdateSubmit = async () => {
    if (pendingMeal?.meal_id && updateText.trim()) {
      console.log("🔄 Submitting update with text:", updateText.trim());
      console.log("🆔 Meal ID:", pendingMeal.meal_id);

      const result = await dispatch(
        updateMeal({
          meal_id: pendingMeal.meal_id,
          updateText: updateText.trim(),
        })
      );

      if (updateMeal.fulfilled.match(result)) {
        Alert.alert("Success", "Meal updated successfully!");
        // Close modal and reset state
        setShowUpdateModal(false);
        setUpdateText("");
        // The pending meal will be cleared automatically by the reducer
      } else {
        console.error("❌ Update failed:", result.payload);
        Alert.alert(
          "Error",
          "Failed to update meal: " + (result.payload || "Unknown error")
        );
      }
    } else if (!pendingMeal?.meal_id) {
      Alert.alert("Error", "Cannot update - no meal ID found");
    } else {
      Alert.alert("Error", "Please enter update text");
    }
  };

  const handleUpdateCancel = () => {
    setShowUpdateModal(false);
    setUpdateText("");
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Analysis",
      "Are you sure you want to discard this analysis?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => dispatch(clearPendingMeal()),
        },
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
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
    return (
      <ScrollView style={styles.container}>
        <View style={styles.analysisContainer}>
          <Image
            source={{
              uri: `data:image/jpeg;base64,${pendingMeal.imageBase64}`,
            }}
            style={styles.analyzedImage}
            onError={(error) => {
              console.error("💥 Image display error:", error);
            }}
          />

          <View style={styles.analysisResults}>
            <Text style={styles.analysisTitle}>Analysis Results</Text>

            <Text style={styles.mealName}>
              {pendingMeal.analysis?.description ||
                pendingMeal.analysis?.name ||
                "Unknown Meal"}
            </Text>

            {(pendingMeal.analysis?.description ||
              pendingMeal.analysis?.name) && (
              <Text style={styles.mealDescription}>
                {pendingMeal.analysis.description || pendingMeal.analysis.name}
              </Text>
            )}

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(
                    pendingMeal.analysis?.totalCalories ||
                      pendingMeal.analysis?.calories ||
                      0
                  )}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(
                    pendingMeal.analysis?.totalProtein ||
                      pendingMeal.analysis?.protein ||
                      0
                  )}
                  g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(
                    pendingMeal.analysis?.totalCarbs ||
                      pendingMeal.analysis?.carbs ||
                      0
                  )}
                  g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(
                    pendingMeal.analysis?.totalFat ||
                      pendingMeal.analysis?.fat ||
                      0
                  )}
                  g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.discardButton]}
              onPress={handleDiscard}
              disabled={isPosting || isUpdating}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={handleUpdate}
              disabled={isPosting || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.postButton]}
              onPress={handlePost}
              disabled={isPosting || isUpdating}
            >
              {isPosting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post Meal</Text>
              )}
            </TouchableOpacity>
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
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleUpdateSubmit}
                  disabled={!updateText.trim() || isUpdating}
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
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Your Meal</Text>
      <Text style={styles.subtitle}>
        Take a photo or select from gallery to get nutrition analysis
      </Text>

      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.analyzingText}>Analyzing your meal...</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cameraButton, isAnalyzing && styles.buttonDisabled]}
          onPress={() => setShowCamera(true)}
          disabled={isAnalyzing}
        >
          <Ionicons name="camera" size={30} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.galleryButton, isAnalyzing && styles.buttonDisabled]}
          onPress={pickImage}
          disabled={isAnalyzing}
        >
          <Ionicons name="images" size={30} color="#007AFF" />
          <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
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
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  galleryButton: {
    borderWidth: 2,
    borderColor: "#007AFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  galleryButtonText: {
    color: "#007AFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  analyzingContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  analyzingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 3,
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
