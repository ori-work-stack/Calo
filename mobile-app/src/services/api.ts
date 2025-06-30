import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SignUpData,
  SignInData,
  AuthResponse,
  MealAnalysisData,
  Meal,
  AIResponse,
} from "../types";

// Replace with your server URL
const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await api.post("/auth/signin", data);
    return response.data;
  },
};

export const nutritionAPI = {
  analyzeMeal: async (imageUri: string): Promise<AIResponse> => {
    // Convert image to base64
    const base64 = await fetch(imageUri)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const base64 = base64data.split(",")[1];
              resolve(base64);
            };
            reader.readAsDataURL(blob);
          })
      );

    const response = await api.post("/nutrition/analyze", { image: base64 });
    return response.data;
  },

  saveMeal: async (
    mealData: MealAnalysisData,
    imageUri?: string
  ): Promise<Meal> => {
    const response = await api.post("/nutrition/meals", {
      ...mealData,
      imageUrl: imageUri,
    });
    return response.data;
  },

  getMeals: async (): Promise<Meal[]> => {
    const response = await api.get("/nutrition/meals");
    return response.data;
  },

  getDailyStats: async (date: string) => {
    const response = await api.get(`/nutrition/stats/daily?date=${date}`);
    return response.data;
  },
};
