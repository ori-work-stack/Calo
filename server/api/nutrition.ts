export interface MealAnalysisData {
  imageBase64: string;
  language: 'english' | 'hebrew';
  date: string;
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface AIResponse {
  description: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  healthScore: number;
  recommendations: string;
}

export interface Meal {
  id: string;
  userId: string;
  imageUrl?: string;
  description: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  healthScore: number;
  recommendations?: string;
  mealType: string;
  consumedAt: string;
  foodItems: MealItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MealAnalysisResponse {
  success: boolean;
  meal?: Meal;
  error?: string;
}

export interface MealsResponse {
  success: boolean;
  meals?: Meal[];
  error?: string;
}

export interface DailyStats {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  mealsCount: number;
  averageHealthScore: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: DailyStats;
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:5000/api';

export class NutritionAPI {
  private static getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  static async analyzeMeal(token: string, data: MealAnalysisData): Promise<MealAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/nutrition/analyze`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    
    return response.json();
  }

  static async getMeals(token: string, date?: string): Promise<MealsResponse> {
    const url = new URL(`${API_BASE_URL}/nutrition/meals`);
    if (date) {
      url.searchParams.append('date', date);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    
    return response.json();
  }

  static async getDailyStats(token: string, date: string): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE_URL}/nutrition/stats/${date}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    
    return response.json();
  }
}