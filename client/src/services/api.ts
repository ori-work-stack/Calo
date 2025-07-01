import axios from "axios";
import { SignInData, SignUpData, MealAnalysisData, Meal } from "../types";
import * as Keychain from "react-native-keychain";
import { Platform } from "react-native";

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    // For web development, use localhost
    return "http://localhost:5000/api";
  } else {
    // For mobile devices, use your computer's IP address
    // Replace this with your actual computer's IP address
    return "http://192.168.1.56:5000/api"; // Change this to your computer's IP
  }
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to get token - ALWAYS use Keychain for security
const getAuthToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      // For web, we need to handle differently since Keychain might not work
      // This is a temporary fallback - in production, use secure web storage
      const token = localStorage.getItem("temp_auth_token");
      console.log("🌐 Web token retrieved:", token ? "Found" : "Not found");
      return token;
    } else {
      const credentials = await Keychain.getInternetCredentials("myapp_auth");
      const token = credentials ? credentials.password : null;
      console.log("📱 Mobile token retrieved:", token ? "Found" : "Not found");
      return token;
    }
  } catch (error) {
    console.warn("⚠️ Failed to get auth token:", error);
    return null;
  }
};

// Helper function to store token - ALWAYS use Keychain for security
const storeAuthToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      // For web, temporary fallback
      localStorage.setItem("temp_auth_token", token);
      console.log("🌐 Web token stored");
    } else {
      await Keychain.setInternetCredentials("myapp_auth", "token", token);
      console.log("📱 Mobile token stored securely");
    }
    console.log("🔐 Token stored securely");
  } catch (error) {
    console.warn("⚠️ Failed to store auth token:", error);
  }
};

// Helper function to clear token - ALWAYS use Keychain for security
const clearAuthToken = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("temp_auth_token");
      console.log("🌐 Web token cleared");
    } else {
      await Keychain.resetInternetCredentials("myapp_auth");
      console.log("📱 Mobile token cleared");
    }
    console.log("🗑️ Token cleared securely");
  } catch (error) {
    console.warn("⚠️ Failed to clear auth token:", error);
  }
};

// Helper function to transform server meal data to client format
const transformMealData = (serverMeal: any): Meal => {
  console.log("🔄 Transforming meal data:", serverMeal);

  const transformed = {
    // Server fields (keep as-is)
    meal_id: serverMeal.meal_id,
    user_id: serverMeal.user_id,
    image_url: serverMeal.image_url,
    upload_time: serverMeal.upload_time,
    analysis_status: serverMeal.analysis_status,
    meal_name: serverMeal.meal_name,
    calories: serverMeal.calories,
    protein_g: serverMeal.protein_g,
    carbs_g: serverMeal.carbs_g,
    fats_g: serverMeal.fats_g,
    fiber_g: serverMeal.fiber_g,
    sugar_g: serverMeal.sugar_g,
    sodium_mg: serverMeal.sodium_mg,
    createdAt: serverMeal.createdAt,

    // Computed fields for compatibility
    id: serverMeal.meal_id?.toString() || serverMeal.id,
    name: serverMeal.meal_name || "Unknown Meal",
    description: serverMeal.meal_name,
    imageUrl: serverMeal.image_url,
    protein: serverMeal.protein_g || 0,
    carbs: serverMeal.carbs_g || 0,
    fat: serverMeal.fats_g || 0,
    fiber: serverMeal.fiber_g || 0,
    sugar: serverMeal.sugar_g || 0,
    sodium: serverMeal.sodium_mg || 0,
    userId: serverMeal.user_id,

    // Optional fields
    saturated_fats_g: serverMeal.saturated_fats_g,
    polyunsaturated_fats_g: serverMeal.polyunsaturated_fats_g,
    monounsaturated_fats_g: serverMeal.monounsaturated_fats_g,
    omega_3_g: serverMeal.omega_3_g,
    omega_6_g: serverMeal.omega_6_g,
    soluble_fiber_g: serverMeal.soluble_fiber_g,
    insoluble_fiber_g: serverMeal.insoluble_fiber_g,
    cholesterol_mg: serverMeal.cholesterol_mg,
    alcohol_g: serverMeal.alcohol_g,
    caffeine_mg: serverMeal.caffeine_mg,
    liquids_ml: serverMeal.liquids_ml,
    serving_size_g: serverMeal.serving_size_g,
    allergens_json: serverMeal.allergens_json,
    vitamins_json: serverMeal.vitamins_json,
    micronutrients_json: serverMeal.micronutrients_json,
    glycemic_index: serverMeal.glycemic_index,
    insulin_index: serverMeal.insulin_index,
    food_category: serverMeal.food_category,
    processing_level: serverMeal.processing_level,
    cooking_method: serverMeal.cooking_method,
    additives_json: serverMeal.additives_json,
    health_risk_notes: serverMeal.health_risk_notes,
  };

  console.log("✅ Transformed meal:", transformed);
  return transformed;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Adding auth token to request");
      } else {
        console.log("⚠️ No auth token found for request");
      }
    } catch (error) {
      console.warn("⚠️ Failed to get auth token for request:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("🚨 API Response Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored token
      try {
        await clearAuthToken();
        console.log("🗑️ Cleared invalid token");
      } catch (clearError) {
        console.warn("⚠️ Failed to clear token:", clearError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signIn: async (data: SignInData) => {
    try {
      console.log("🔑 Attempting sign in...");
      const response = await api.post("/auth/signin", data);

      // Store token if sign-in is successful
      if (response.data.success && response.data.token) {
        await storeAuthToken(response.data.token);
        console.log("✅ Sign in successful, token stored securely");
      }

      return response.data;
    } catch (error) {
      console.error("💥 Sign in error:", error);
      throw error;
    }
  },

  signUp: async (data: SignUpData) => {
    try {
      console.log("📝 Attempting sign up...");
      const response = await api.post("/auth/signup", data);

      // Store token if sign-up is successful
      if (response.data.success && response.data.token) {
        await storeAuthToken(response.data.token);
        console.log("✅ Sign up successful, token stored securely");
      }

      return response.data;
    } catch (error) {
      console.error("💥 Sign up error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await clearAuthToken();
      console.log("🔓 Auth token cleared securely");
    } catch (error) {
      console.error("💥 Sign out error:", error);
      throw error;
    }
  },

  getStoredToken: async () => {
    try {
      return await getAuthToken();
    } catch (error) {
      console.error("💥 Get stored token error:", error);
      return null;
    }
  },
};

export const nutritionAPI = {
  analyzeMeal: async (
    imageBase64: string
  ): Promise<{ success: boolean; data?: MealAnalysisData; error?: string }> => {
    try {
      console.log("🔍 Making analyze meal API request...");
      console.log("📊 Base64 length:", imageBase64.length);

      const response = await api.post("/nutrition/analyze", {
        imageBase64: imageBase64,
        language: "english",
        date: new Date().toISOString().split("T")[0],
      });

      console.log("🎯 RAW ANALYZE API RESPONSE:");
      console.log("=====================================");
      console.log("📋 Full Response:", JSON.stringify(response.data, null, 2));
      console.log("=====================================");

      return response.data;
    } catch (error: any) {
      console.error("💥 Analyze meal API error:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
        return {
          success: false,
          error: error.response.data?.error || "Server error occurred",
        };
      } else if (error.request) {
        console.error("Network error:", error.request);
        return {
          success: false,
          error: "Network error - please check your connection and server IP",
        };
      } else {
        console.error("Request setup error:", error.message);
        return {
          success: false,
          error: error.message || "Failed to make request",
        };
      }
    }
  },

  updateMeal: async (
    meal_id: string,
    updateText: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      console.log("🔄 Making update meal API request...");
      console.log("🆔 Meal ID:", meal_id);
      console.log("📝 Update text:", updateText);

      const response = await api.put("/nutrition/update", {
        meal_id,
        updateText,
        language: "english",
      });

      console.log("🎯 RAW UPDATE API RESPONSE:");
      console.log("=====================================");
      console.log("📋 Full Response:", JSON.stringify(response.data, null, 2));
      console.log("=====================================");

      if (response.data.success && response.data.data) {
        // Transform the meal data
        const transformedMeal = transformMealData(response.data.data);
        return {
          success: true,
          data: transformedMeal,
        };
      }

      return response.data;
    } catch (error: any) {
      console.error("💥 Update meal API error:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
        return {
          success: false,
          error: error.response.data?.error || "Server error occurred",
        };
      } else if (error.request) {
        console.error("Network error:", error.request);
        return {
          success: false,
          error: "Network error - please check your connection and server IP",
        };
      } else {
        console.error("Request setup error:", error.message);
        return {
          success: false,
          error: error.message || "Failed to make request",
        };
      }
    }
  },

  saveMeal: async (
    mealData: MealAnalysisData,
    imageBase64?: string
  ): Promise<Meal> => {
    try {
      console.log("📤 Making save meal API request...");

      const response = await api.post("/nutrition/save", {
        mealData,
        imageBase64,
      });

      console.log("🎯 RAW SAVE API RESPONSE:");
      console.log("=====================================");
      console.log("📋 Full Response:", JSON.stringify(response.data, null, 2));
      console.log("=====================================");

      if (response.data.success && response.data.data) {
        return transformMealData(response.data.data);
      } else {
        throw new Error(response.data.error || "Failed to save meal");
      }
    } catch (error: any) {
      console.error("💥 Save meal API error:", error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to save meal");
      }
    }
  },

  getMeals: async (): Promise<Meal[]> => {
    try {
      console.log("📥 Making get meals API request...");

      const response = await api.get("/nutrition/meals");

      console.log("🎯 RAW GET MEALS API RESPONSE:");
      console.log("=====================================");
      console.log("📋 Full Response:", JSON.stringify(response.data, null, 2));
      console.log("=====================================");

      if (response.data.success) {
        const meals = response.data.data || [];
        console.log("🔄 Transforming", meals.length, "meals...");

        // Transform each meal to match our interface
        const transformedMeals = meals.map((meal: any) =>
          transformMealData(meal)
        );

        console.log("✅ Transformed meals:", transformedMeals.length);
        return transformedMeals;
      } else {
        throw new Error(response.data.error || "Failed to fetch meals");
      }
    } catch (error: any) {
      console.error("💥 Get meals API error:", error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch meals");
      }
    }
  },

  getDailyStats: async (date: string) => {
    try {
      console.log("📊 Making get daily stats API request for date:", date);

      const response = await api.get(`/nutrition/stats/${date}`);

      console.log("🎯 RAW DAILY STATS API RESPONSE:");
      console.log("=====================================");
      console.log("📋 Full Response:", JSON.stringify(response.data, null, 2));
      console.log("=====================================");

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Failed to fetch daily stats");
      }
    } catch (error: any) {
      console.error("💥 Get daily stats API error:", error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch daily stats");
      }
    }
  },

  // New API methods for meal feedback and favorites
  saveMealFeedback: async (
    mealId: string,
    feedback: {
      tasteRating?: number;
      satietyRating?: number;
      energyRating?: number;
      heavinessRating?: number;
    }
  ) => {
    try {
      console.log("💬 Making save meal feedback API request...");

      const response = await api.post(
        `/nutrition/meals/${mealId}/feedback`,
        feedback
      );

      console.log("✅ Save feedback response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💥 Save feedback API error:", error);
      throw error;
    }
  },

  toggleMealFavorite: async (mealId: string) => {
    try {
      console.log("❤️ Making toggle meal favorite API request...");

      const response = await api.post(`/nutrition/meals/${mealId}/favorite`);

      console.log("✅ Toggle favorite response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💥 Toggle favorite API error:", error);
      throw error;
    }
  },

  duplicateMeal: async (mealId: string, newDate?: string) => {
    try {
      console.log("📋 Making duplicate meal API request...");

      const response = await api.post(`/nutrition/meals/${mealId}/duplicate`, {
        newDate: newDate || new Date().toISOString().split("T")[0],
      });

      console.log("✅ Duplicate meal response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💥 Duplicate meal API error:", error);
      throw error;
    }
  },
};
