import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import { fetchMeals, updateMeal } from "../../src/store/mealSlice";
import { Meal } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

export default function MealsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { meals, isLoading, isUpdating } = useSelector((state: RootState) => state.meal);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [updateText, setUpdateText] = useState("");

  useEffect(() => {
    dispatch(fetchMeals());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchMeals());
  };

  const handleUpdateMeal = (meal: Meal) => {
    setSelectedMeal(meal);
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (selectedMeal && updateText.trim()) {
      const result = await dispatch(updateMeal({
        meal_id: selectedMeal.id,
        updateText: updateText.trim()
      }));
      
      if (updateMeal.fulfilled.match(result)) {
        Alert.alert("Success", "Meal updated successfully!");
        setShowUpdateModal(false);
        setUpdateText("");
        setSelectedMeal(null);
        // Refresh meals to get updated data
        dispatch(fetchMeals());
      }
    } else {
      Alert.alert("Error", "Please enter update text");
    }
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.mealImage} />
      )}
      <View style={styles.mealInfo}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealName}>{item.name}</Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleUpdateMeal(item)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {item.description && (
          <Text style={styles.mealDescription}>{item.description}</Text>
        )}
        <Text style={styles.mealDate}>
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.calories)}
            </Text>
            <Text style={styles.nutritionLabel}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>
              {Math.round(item.protein)}g
            </Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.carbs)}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{Math.round(item.fat)}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading && meals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          meals.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No meals yet</Text>
            <Text style={styles.emptyText}>
              Start by taking a photo of your meal to analyze its nutrition!
            </Text>
          </View>
        }
      />

      {/* Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Meal</Text>
            <Text style={styles.modalSubtitle}>
              Add additional information about "{selectedMeal?.name}"
            </Text>
            
            <TextInput
              style={styles.updateInput}
              placeholder="Enter additional meal information..."
              value={updateText}
              onChangeText={setUpdateText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowUpdateModal(false);
                  setUpdateText("");
                  setSelectedMeal(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateSubmit}
                disabled={!updateText.trim() || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Update</Text>
                )}
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
  mealImage: {
    width: "100%",
    height: 150,
  },
  mealInfo: {
    padding: 15,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  mealName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  updateButton: {
    padding: 5,
  },
  mealDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  mealDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 15,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
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