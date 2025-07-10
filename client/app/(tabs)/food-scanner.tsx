import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Camera, CameraType, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import { analyzeMeal } from "../../src/store/mealSlice";
import saveMeal from "../../src/store/mealSlice";
import { useTranslation } from "react-i18next";
import { useRTLStyles } from "../../hooks/useRTLStyle";
import { SafeAreaView } from "react-native-safe-area-context";
import { foodScannerAPI } from "@/src/services/api";
import { t } from "i18next";
import { api } from "../../src/services/api";

interface ProductData {
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  nutrition_per_100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  ingredients: string[];
  allergens: string[];
  labels: string[];
  health_score?: number;
  image_url?: string;
}

interface UserAnalysis {
  compatibility_score: number;
  daily_contribution: {
    calories_percent: number;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  alerts: string[];
  recommendations: string[];
  health_assessment: string;
}

export default function FoodScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "image">("barcode");
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [quantity, setQuantity] = useState("100");
  const [showAddToMeal, setShowAddToMeal] = useState(false);
  const [mealRating, setMealRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [scannedFood, setScannedFood] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [scannedHistory, setScannedHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const getHealthDeviationColor = (rate: number) => {
    if (rate <= 10) return "#4CAF50"; // Green - Good
    if (rate <= 25) return "#FF9800"; // Orange - Moderate
    return "#F44336"; // Red - High deviation
  };

  const renderMealComponents = () => {
    if (!productData || !productData.ingredients) return null;

    return (
      <View style={styles.componentsContainer}>
        <Text style={styles.sectionTitle}>{t("food_scanner.ingredients")}</Text>
        <View style={styles.componentsGrid}>
          {productData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.componentItem}>
              <Text style={styles.componentName}>{ingredient}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRatingSection = () => {
    if (hasRated) return null;

    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.sectionTitle}>{t("history.rate_meal")}</Text>
        <Text style={styles.ratingDescription}>
          {t("history.rating_scale")}
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setMealRating(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= mealRating ? "star" : "star-outline"}
                size={32}
                color={star <= mealRating ? "#FFD700" : "#ddd"}
              />
            </TouchableOpacity>
          ))}
        </View>
        {mealRating > 0 && (
          <TouchableOpacity
            style={styles.submitRatingButton}
            onPress={() => {
              setHasRated(true);
              Alert.alert("Success", "Rating saved successfully!");
            }}
          >
            <Text style={styles.submitRatingText}>{t("common.save")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  useEffect(() => {
    getCameraPermissions();
    loadScannedHistory();
  }, []);

  const loadScannedHistory = async () => {
    try {
      const response = await foodScannerAPI.getScannedHistory();
      console.log(response);
      if (response.success) {
        const historyData = response.data.map((item: any) => ({
          name: item.product_name,
          brand: item.brand,
          category: item.category,
          nutrition_per_100g: item.nutrition_per_100g,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          labels: item.labels || [],
          health_score: item.health_score,
          image_url: item.image_url,
          barcode: item.barcode,
        }));
        setScannedHistory(historyData);
      }
      console.log(scannedHistory, "hello world");
    } catch (error) {
      console.error("Error loading scanned history:", error);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("scannedHistory");
        if (stored) {
          setScannedHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }
  };

  const saveToHistory = (product: ProductData) => {
    const newHistory = [product, ...scannedHistory].slice(0, 20); // Keep last 20 items
    setScannedHistory(newHistory);
    localStorage.setItem("scannedHistory", JSON.stringify(newHistory));
  };

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarcodeScan = async (scanningResult: any) => {
    if (isLoading) return;

    setIsLoading(true);
    setIsScanning(false);

    try {
      const response = await foodScannerAPI.scanBarcode(scanningResult.data);

      if (response.success && response.data) {
        const productData = response.data.product;
        setProductData(productData);
        setUserAnalysis(response.data.user_analysis);
        saveToHistory(productData);
        setShowResults(true);
      } else {
        Alert.alert(
          t("food_scanner.product_not_found") || "מוצר לא נמצא",
          t("food_scanner.product_not_found_message") ||
            "לא הצלחנו למצוא את המוצר במסד הנתונים שלנו"
        );
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בסריקת הברקוד");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageScan = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);

        try {
          const response = await foodScannerAPI.scanProductImage(
            result.assets[0].base64
          );

          if (response.success && response.data) {
            const productData = response.data.product;
            setProductData(productData);
            setUserAnalysis(response.data.user_analysis);
            saveToHistory(productData);
            setShowResults(true);
          } else {
            Alert.alert(
              t("food_scanner.scan_failed") || "סריקה נכשלה",
              t("food_scanner.scan_failed_message") ||
                "לא הצלחנו לזהות את המוצר בתמונה"
            );
          }
        } catch (error) {
          console.error("Image scan error:", error);
          Alert.alert("שגיאה", "אירעה שגיאה בסריקת התמונה");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("שגיאה", "לא הצלחנו לפתוח את המצלמה");
    }
  };

  const addToMealLog = async (mealTiming: string) => {
    if (!productData) return;

    try {
      setIsLoading(true);

      await foodScannerAPI.addToMealLog(
        productData,
        parseInt(quantity),
        mealTiming
      );

      Alert.alert("הצלחה", "המוצר נוסף ליומן הארוחות שלך");
      setShowAddToMeal(false);
      setShowResults(false);
    } catch (error) {
      console.error("Add to meal error:", error);
      Alert.alert("שגיאה", "לא הצלחנו להוסיף את המוצר ליומן");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FF9800";
    if (score >= 40) return "#FF5722";
    return "#F44336";
  };

  const renderNutritionInfo = () => {
    if (!productData) return null;

    const nutrition = productData.nutrition_per_100g;
    const qty = parseInt(quantity) / 100;

    return (
      <View style={styles.nutritionContainer}>
        <Text style={styles.sectionTitle}>ערכים תזונתיים ל-{quantity} גרם</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.calories * qty)}
            </Text>
            <Text style={styles.nutritionLabel}>קלוריות</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.protein * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>חלבון</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.carbs * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>פחמימות</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(nutrition.fat * qty)}ג
            </Text>
            <Text style={styles.nutritionLabel}>שומן</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserAnalysis = () => {
    if (!userAnalysis) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.sectionTitle}>ניתוח אישי</Text>

        <View style={styles.scoreContainer}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: getScoreColor(userAnalysis.compatibility_score) },
            ]}
          >
            <Text
              style={[
                styles.scoreText,
                { color: getScoreColor(userAnalysis.compatibility_score) },
              ]}
            >
              {userAnalysis.compatibility_score}
            </Text>
          </View>
          <Text style={styles.healthAssessment}>
            {userAnalysis.health_assessment}
          </Text>
        </View>

        {userAnalysis.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>התראות:</Text>
            {userAnalysis.alerts.map((alert, index) => (
              <Text key={index} style={styles.alertText}>
                {alert}
              </Text>
            ))}
          </View>
        )}

        {userAnalysis.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>המלצות:</Text>
            {userAnalysis.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>
                {rec}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const handleScanResult = async (result: any) => {
    try {
      setLoading(true);

      // Process the scanned result
      //const processedData = await processScanResult(result);
      //setScannedFood(processedData);

      // Show meal selection instead of auto-saving
      setShowMealSelector(true);
    } catch (error) {
      console.error("Scan processing error:", error);
      alert("Error processing scan result");
    } finally {
      setLoading(false);
    }
  };

  const saveMeal = async (
    foodData: any,
    mealType: string = "breakfast",
    quantity: number = 100
  ) => {
    try {
      const now = new Date();
      const mealData = {
        name: foodData.name,
        description: foodData.description,
        calories: Math.round((foodData.calories * quantity) / 100),
        protein: Math.round((foodData.protein * quantity) / 100),
        carbs: Math.round((foodData.carbs * quantity) / 100),
        fat: Math.round((foodData.fat * quantity) / 100),
        fiber: Math.round((foodData.fiber * quantity) / 100) || 0,
        sugar: Math.round((foodData.sugar * quantity) / 100) || 0,
        sodium: Math.round((foodData.sodium * quantity) / 100) || 0,
        quantity: quantity,
        meal_type: mealType,
        date: formatDateForAPI(now),
        time: now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        ingredients: foodData.ingredients || "",
        allergens: foodData.allergens || [],
        barcode: foodData.barcode || null,
        source: foodData.source || "scanner",
      };

      console.log("💾 Saving meal data:", mealData);
      const response = await api.post("/nutrition/meals", mealData);
      console.log("✅ Meal saved:", response.data);

      // Add to scan history
      const historyItem = {
        ...foodData,
        scannedAt: now.toISOString(),
        savedAs: mealType,
        quantity: quantity,
      };
      setScannedHistory((prev) => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 items

      alert(`Meal saved to ${mealType}!`);
      setShowMealSelector(false);
    } catch (error) {
      console.error("💥 Error saving meal:", error);
      alert("Error saving meal");
    }
  };

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>מבקש הרשאות מצלמה...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.noPermissionContainer}>
        <Ionicons name="camera" size={48} color="#666" />
        <Text style={styles.noPermissionText}>
          נדרשת הרשאה למצלמה כדי לסרוק מוצרים
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={getCameraPermissions}
        >
          <Text style={styles.permissionButtonText}>הענק הרשאה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>סריקת מוצרי מזון</Text>
        <View style={styles.headerControls}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                scanMode === "barcode" && styles.activeModeButton,
              ]}
              onPress={() => setScanMode("barcode")}
            >
              <Ionicons
                name="barcode"
                size={20}
                color={scanMode === "barcode" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  scanMode === "barcode" && styles.activeModeButtonText,
                ]}
              >
                {t("food_scanner.barcode") || "ברקוד"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                scanMode === "image" && styles.activeModeButton,
              ]}
              onPress={() => setScanMode("image")}
            >
              <Ionicons
                name="camera"
                size={20}
                color={scanMode === "image" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  scanMode === "image" && styles.activeModeButtonText,
                ]}
              >
                {t("food_scanner.image") || "תמונה"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowHistory(true)}
          >
            <Ionicons name="time" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner */}
      {!isScanning && !showResults && (
        <View style={styles.scannerContainer}>
          <View style={styles.instructionsContainer}>
            <Ionicons
              name={scanMode === "barcode" ? "barcode" : "camera"}
              size={64}
              color="#007AFF"
            />
            <Text style={styles.instructionsTitle}>
              {scanMode === "barcode"
                ? `${t("food_scanner.scan_food")}`
                : `${t("food_scanner.photo_food")}`}
            </Text>
            <Text style={styles.instructionsText}>
              {scanMode === "barcode"
                ? `${t("food_scanner.barcode_instructions")}`
                : `${t("food_scanner.image_instructions")}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() =>
              scanMode === "barcode" ? setIsScanning(true) : handleImageScan()
            }
          >
            <Text style={styles.scanButtonText}>
              {scanMode === "barcode"
                ? `${t("food_scanner.start_scan")}`
                : `${t("food_scanner.take_photo")}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera View for Barcode */}
      {isScanning && scanMode === "barcode" && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarcodeScan}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "code128", "code39"],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstructions}>
                כוון את הברקוד למרכז המסגרת
              </Text>
            </View>
          </CameraView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.cancelButtonText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>מעבד את המוצר...</Text>
        </View>
      )}

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowResults(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>תוצאות סריקה</Text>
            <TouchableOpacity onPress={() => setShowAddToMeal(true)}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsContainer}>
            {productData && (
              <>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{productData.name}</Text>
                  {productData.brand && (
                    <Text style={styles.productBrand}>{productData.brand}</Text>
                  )}
                  <Text style={styles.productCategory}>
                    {productData.category}
                  </Text>
                </View>

                <View style={styles.quantitySelector}>
                  <Text style={styles.quantityLabel}>כמות (גרם):</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>

                {renderNutritionInfo()}
                {renderUserAnalysis()}

                {productData.ingredients.length > 0 && (
                  <View style={styles.ingredientsContainer}>
                    <Text style={styles.sectionTitle}>רכיבים</Text>
                    <Text style={styles.ingredientsText}>
                      {productData.ingredients.join(", ")}
                    </Text>
                  </View>
                )}

                {productData.allergens.length > 0 && (
                  <View style={styles.allergensContainer}>
                    <Text style={styles.sectionTitle}>אלרגנים</Text>
                    <Text style={styles.allergensText}>
                      {productData.allergens.join(", ")}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add to Meal Modal */}
      <Modal
        visible={showAddToMeal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.addMealContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddToMeal(false)}>
              <Text style={styles.cancelText}>ביטול</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>הוסף ליומן ארוחות</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.mealTimingsContainer}>
            <Text style={styles.mealTimingsTitle}>בחר זמן ארוחה:</Text>
            {["BREAKFAST", "LUNCH", "DINNER", "SNACK"].map((timing) => (
              <TouchableOpacity
                key={timing}
                style={styles.mealTimingButton}
                onPress={() => addToMealLog(timing)}
              >
                <Text style={styles.mealTimingText}>
                  {timing === "BREAKFAST"
                    ? "ארוחת בוקר"
                    : timing === "LUNCH"
                    ? "ארוחת צהריים"
                    : timing === "DINNER"
                    ? "ארוחת ערב"
                    : "חטיף"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {t("food_scanner.scan_history") || "היסטוריית סריקות"}
            </Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.historyContainer}>
            {scannedHistory.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Ionicons name="time-outline" size={64} color="#ccc" />
                <Text style={styles.emptyHistoryText}>
                  {t("food_scanner.no_history") || "אין היסטוריית סריקות"}
                </Text>
              </View>
            ) : (
              scannedHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => {
                    setProductData(item);
                    setShowHistory(false);
                    setShowResults(true);
                  }}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemName}>{item.name}</Text>
                    {item.brand && (
                      <Text style={styles.historyItemBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.historyItemCategory}>
                      {item.category}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  componentsContainer: {
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  componentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  componentItem: {
    backgroundColor: "#eee",
    borderRadius: 8,
    padding: 8,
    margin: 4,
  },
  componentName: {
    fontSize: 14,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  historyItemBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  historyItemCategory: {
    fontSize: 12,
    color: "#999",
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeModeButton: {
    backgroundColor: "#007AFF",
  },
  modeButtonText: {
    marginLeft: 6,
    color: "#666",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  instructionsContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
  },
  scanInstructions: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  cancelButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noPermissionText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
  },
  productHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
  },
  productBrand: {
    fontSize: 16,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  ratingContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginVertical: 16,
    alignItems: "center",
  },
  ratingDescription: {
    fontSize: 14,
    color: "#666",
    marginVertical: 8,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  starButton: {
    marginHorizontal: 6,
  },
  submitRatingButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 8,
  },
  submitRatingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: "center",
  },
  nutritionContainer: {
    padding: 16,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nutritionItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nutritionLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  analysisContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  healthAssessment: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  alertsContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
    textAlign: "right",
  },
  alertText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "right",
    marginBottom: 4,
  },
  recommendationsContainer: {
    backgroundColor: "#d1ecf1",
    padding: 12,
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0c5460",
    marginBottom: 8,
    textAlign: "right",
  },
  recommendationText: {
    fontSize: 14,
    color: "#0c5460",
    textAlign: "right",
    marginBottom: 4,
  },
  ingredientsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  ingredientsText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "right",
  },
  allergensContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f8d7da",
  },
  allergensText: {
    fontSize: 14,
    color: "#721c24",
    lineHeight: 20,
    textAlign: "right",
  },
  addMealContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
  },
  mealTimingsContainer: {
    padding: 16,
  },
  mealTimingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "right",
  },
  mealTimingButton: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mealTimingText: {
    fontSize: 16,
    textAlign: "right",
    color: "#333",
  },
});
