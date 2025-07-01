import axios from "axios";
import { SignInData, SignUpData, MealAnalysisData, Meal } from "../types";
import * as Keychain from "react-native-keychain";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const credentials = await Keychain.getInternetCredentials("myapp_auth");
      if (credentials && credentials.password) {
        // FIXED: Use credentials.password (the token) instead of credentials object
        config.headers.Authorization = `Bearer ${credentials.password}`;
        console.log("Adding auth token to request");
      } else {
        console.log("No auth token found");
      }
    } catch (error) {
      console.warn("Failed to get auth token:", error);
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
    if (error.response?.status === 401) {
      // Token expired or invalid - clear keychain instead of AsyncStorage
      try {
        await Keychain.resetInternetCredentials({ server: "myapp_auth" });
        console.log("Cleared invalid token from keychain");
      } catch (keychainError) {
        console.warn("Failed to clear keychain:", keychainError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signIn: async (data: SignInData) => {
    try {
      const response = await api.post("/auth/signin", data);
      return response.data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  signUp: async (data: SignUpData) => {
    try {
      const response = await api.post("/auth/signup", data);
      return response.data;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      // FIXED: Use keychain instead of AsyncStorage
      await Keychain.resetInternetCredentials({ server: "myapp_auth" });
      console.log("Cleared auth token from keychain");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },
};

export const nutritionAPI = {
  analyzeMeal: async (
    imageBase64: string
  ): Promise<{ success: boolean; data?: MealAnalysisData; error?: string }> => {
    try {
      console.log("Making analyze meal API request...");
      console.log("Base64 length:", imageBase64.length);

      const response = await api.post("/nutrition/analyze", {
        imageBase64: imageBase64,
        language: "english",
        date: new Date().toISOString().split("T")[0],
      });

      console.log("API response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Analyze meal API error:", error);

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
          error: "Network error - please check your connection",
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
      console.log("Making save meal API request...");

      const response = await api.post("/nutrition/save", {
        mealData,
        imageBase64,
      });

      console.log("Save meal response:", response.data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Failed to save meal");
      }
    } catch (error: any) {
      console.error("Save meal API error:", error);

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
      console.log("Making get meals API request...");

      const response = await api.get("/nutrition/meals");

      console.log("Get meals response:", response.data);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.error || "Failed to fetch meals");
      }
    } catch (error: any) {
      console.error("Get meals API error:", error);

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
      console.log("Making get daily stats API request for date:", date);

      const response = await api.get(`/nutrition/stats/${date}`);

      console.log("Get daily stats response:", response.data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "Failed to fetch daily stats");
      }
    } catch (error: any) {
      console.error("Get daily stats API error:", error);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to fetch daily stats");
      }
    }
  },
};
