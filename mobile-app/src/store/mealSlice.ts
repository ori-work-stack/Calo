import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Meal, MealAnalysisData, PendingMeal, AIResponse } from "../types";
import { nutritionAPI } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

interface MealState {
  meals: Meal[];
  pendingMeal: PendingMeal | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  isPosting: boolean;
  error: string | null;
}

const initialState: MealState = {
  meals: [],
  pendingMeal: null,
  isLoading: false,
  isAnalyzing: false,
  isPosting: false,
  error: null,
};

const PENDING_MEAL_KEY = "pendingMeal";

// Helper function to compress/resize image if needed
const processImage = async (imageUri: string): Promise<string> => {
  console.log("Processing image, URI:", imageUri.substring(0, 50) + "...");

  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      // Handle different types of image URIs
      let processUri = imageUri;

      // If it's already a base64 data URI, extract just the base64 part
      if (imageUri.startsWith("data:image/")) {
        const base64Part = imageUri.split(",")[1];
        if (base64Part) {
          console.log("Image is already base64, returning processed version");
          resolve(base64Part);
          return;
        }
      }

      // If it's a blob URL or file URL, process it
      const img = new Image();
      img.crossOrigin = "anonymous"; // Handle CORS issues

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Calculate new dimensions (max 800px width/height)
          const maxSize = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression (0.8 quality for better balance)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          const base64 = dataUrl.split(",")[1]; // Remove data:image/jpeg;base64, prefix

          console.log(
            "Image processed successfully, base64 length:",
            base64.length
          );
          resolve(base64);
        } catch (error) {
          console.error("Error processing image on canvas:", error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        console.error("Error loading image:", error);
        reject(new Error("Failed to load image"));
      };

      img.src = processUri;
    });
  } else {
    // For native platforms
    try {
      console.log("Processing native image...");
      let base64: string;

      if (imageUri.startsWith("data:image/")) {
        // Already a data URI, extract base64 part
        base64 = imageUri.split(",")[1];
      } else {
        // Read from file system
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      console.log("Native image processed, base64 length:", base64.length);
      return base64;
    } catch (error) {
      console.error("Error processing native image:", error);
      throw new Error(
        "Failed to process image: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
};

export const analyzeMeal = createAsyncThunk(
  "meal/analyzeMeal",
  async (imageUri: string, { rejectWithValue }) => {
    try {
      console.log(
        "Starting meal analysis for URI:",
        imageUri.substring(0, 50) + "..."
      );

      // Validate input
      if (!imageUri || imageUri.trim() === "") {
        throw new Error("Image URI is empty or invalid");
      }

      // Process and compress the image
      const imageBase64 = await processImage(imageUri);

      if (!imageBase64 || imageBase64.trim() === "") {
        throw new Error("Image processing returned empty base64 data");
      }

      console.log("Image processed successfully, sending to API...");
      console.log("Base64 data length:", imageBase64.length);
      console.log("Base64 preview:", imageBase64.substring(0, 100) + "...");

      // Make the API call with proper error handling
      const response = await nutritionAPI.analyzeMeal(imageBase64);
      console.log("API response received:", response);

      if (response && response.success && response.data) {
        const pendingMeal: PendingMeal = {
          imageUri: imageUri, // Keep original URI for display
          analysis: response.data,
          timestamp: Date.now(),
        };

        // Save to storage
        try {
          await AsyncStorage.setItem(
            PENDING_MEAL_KEY,
            JSON.stringify(pendingMeal)
          );
          console.log("Pending meal saved to storage");
        } catch (storageError) {
          console.warn("Failed to save pending meal to storage:", storageError);
          // Don't fail the whole operation for storage issues
        }

        console.log("Analysis completed successfully");
        return pendingMeal;
      } else {
        const errorMessage =
          response?.error || "Analysis failed - no data returned";
        console.error("Analysis failed:", errorMessage);
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      console.error("Analysis error details:", error);

      // Provide more specific error messages
      let errorMessage = "Analysis failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Handle specific error types
      if (
        errorMessage.includes("Network Error") ||
        errorMessage.includes("ERR_NETWORK")
      ) {
        errorMessage = "Network error - please check your connection";
      } else if (errorMessage.includes("400")) {
        errorMessage = "Invalid image data - please try a different image";
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "Authentication error - please log in again";
      } else if (errorMessage.includes("500")) {
        errorMessage = "Server error - please try again later";
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const postMeal = createAsyncThunk(
  "meal/postMeal",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { meal: MealState };
      const { pendingMeal } = state.meal;

      if (!pendingMeal) {
        return rejectWithValue("No pending meal to post");
      }

      if (!pendingMeal.analysis) {
        return rejectWithValue("No meal analysis data to post");
      }

      console.log("Posting meal with analysis:", pendingMeal.analysis);
      const response = await nutritionAPI.saveMeal(
        pendingMeal.analysis,
        pendingMeal.imageUri
      );

      if (response) {
        // Clean up storage
        try {
          await AsyncStorage.removeItem(PENDING_MEAL_KEY);
          console.log("Pending meal removed from storage");
        } catch (storageError) {
          console.warn(
            "Failed to remove pending meal from storage:",
            storageError
          );
        }

        console.log("Meal posted successfully");
        return response;
      }

      return rejectWithValue("Failed to post meal - no response from server");
    } catch (error) {
      console.error("Post meal error:", error);

      let errorMessage = "Failed to post meal";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMeals = createAsyncThunk(
  "meal/fetchMeals",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching meals from API...");
      const meals = await nutritionAPI.getMeals();
      console.log("Meals fetched successfully, count:", meals?.length || 0);
      return meals || [];
    } catch (error) {
      console.error("Fetch meals error:", error);

      let errorMessage = "Failed to fetch meals";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const loadPendingMeal = createAsyncThunk(
  "meal/loadPendingMeal",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Loading pending meal from storage...");
      const stored = await AsyncStorage.getItem(PENDING_MEAL_KEY);

      if (stored) {
        const pendingMeal = JSON.parse(stored);
        console.log("Pending meal loaded from storage");
        return pendingMeal;
      } else {
        console.log("No pending meal found in storage");
        return null;
      }
    } catch (error) {
      console.error("Load pending meal error:", error);
      // Don't reject, just return null for storage errors
      return null;
    }
  }
);

const mealSlice = createSlice({
  name: "meal",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPendingMeal: (state) => {
      state.pendingMeal = null;
      // Clear from storage asynchronously
      AsyncStorage.removeItem(PENDING_MEAL_KEY).catch((error) => {
        console.warn("Failed to remove pending meal from storage:", error);
      });
    },
    setPendingMeal: (state, action: PayloadAction<PendingMeal>) => {
      state.pendingMeal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Analyze meal cases
      .addCase(analyzeMeal.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
        console.log("Analysis started...");
      })
      .addCase(analyzeMeal.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.pendingMeal = action.payload;
        state.error = null;
        console.log("Analysis completed successfully");
      })
      .addCase(analyzeMeal.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload as string;
        console.log("Analysis failed:", action.payload);
      })

      // Post meal cases
      .addCase(postMeal.pending, (state) => {
        state.isPosting = true;
        state.error = null;
        console.log("Posting meal...");
      })
      .addCase(postMeal.fulfilled, (state, action) => {
        state.isPosting = false;
        state.pendingMeal = null;
        state.error = null;
        // Add the new meal to the beginning of the list
        if (action.payload) {
          state.meals.unshift(action.payload);
        }
        console.log("Meal posted successfully");
      })
      .addCase(postMeal.rejected, (state, action) => {
        state.isPosting = false;
        state.error = action.payload as string;
        console.log("Meal posting failed:", action.payload);
      })

      // Fetch meals cases
      .addCase(fetchMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.meals = action.payload;
        state.error = null;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load pending meal cases
      .addCase(loadPendingMeal.pending, (state) => {
        // Don't show loading for this background operation
      })
      .addCase(loadPendingMeal.fulfilled, (state, action) => {
        if (action.payload) {
          state.pendingMeal = action.payload;
          console.log("Pending meal restored from storage");
        }
      })
      .addCase(loadPendingMeal.rejected, (state, action) => {
        // Don't set error for storage loading failures
        console.warn("Failed to load pending meal:", action.payload);
      });
  },
});

export const { clearError, clearPendingMeal, setPendingMeal } =
  mealSlice.actions;
export default mealSlice.reducer;
