
export interface MealAnalysisData {
  imageBase64: string;
  language?: 'english' | 'hebrew';
  date?: string;
}

export interface MealItem {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugar?: string;
}

export interface AIResponse {
  description: string;
  items: MealItem[];
  totalCalories: string;
  totalProtein: string;
  totalCarbs: string;
  totalFat: string;
  healthScore: string;
  recommendations: string;
}

export interface Meal {
  id: string;
  image: string;
  aiResponse: AIResponse;
  calories: number;
  timestamp: string;
}

export interface MealAnalysisResponse {
  success: boolean;
  meal?: Meal;
  remainingRequests?: number;
  error?: string;
}

export interface MealsResponse {
  success: boolean;
  meals?: Meal[];
  error?: string;
}

export interface DailyStats {
  totalCalories: number;
  totalMeals: number;
  averageHealthScore: number;
  meals: Meal[];
}

export interface StatsResponse {
  success: boolean;
  stats?: DailyStats;
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
