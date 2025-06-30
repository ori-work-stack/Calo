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
const BASE_URL = "http://0.0.0.0:5000/api";

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
  analyzeMeal: async (imageBase64: string): Promise<AIResponse> => {
    const response = await api.post("/nutrition/analyze", { 
      imageBase64: imageBase64,
      language: 'english'
    });
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
