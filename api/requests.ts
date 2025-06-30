
// Example request functions showing how to use the API clients
import { AuthAPI, NutritionAPI, UserAPI } from './index';

// Auth Requests Examples
export class AuthRequests {
  
  // Sign up a new user
  static async signUpUser(userData: {
    email: string;
    username: string;
    name: string;
    password: string;
  }) {
    try {
      const response = await AuthAPI.signUp(userData);
      
      if (response.success && response.token) {
        // Store token in localStorage or secure storage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Sign in existing user
  static async signInUser(credentials: {
    email: string;
    password: string;
  }) {
    try {
      const response = await AuthAPI.signIn(credentials);
      
      if (response.success && response.token) {
        // Store token in localStorage or secure storage
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Get current user profile
  static async getCurrentUser() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await AuthAPI.getMe(token);
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Sign out user
  static async signOutUser() {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await AuthAPI.signOut(token);
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { success: true };
    }
  }
}

// Nutrition Requests Examples
export class NutritionRequests {
  
  // Analyze meal from image
  static async analyzeMealImage(imageFile: File, language: 'english' | 'hebrew' = 'english') {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      // Convert image to base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      const response = await NutritionAPI.analyzeMeal(token, {
        imageBase64,
        language,
        date: new Date().toISOString().split('T')[0]
      });

      return response;
    } catch (error) {
      console.error('Meal analysis error:', error);
      return { success: false, error: 'Failed to analyze meal' };
    }
  }

  // Get meals for a specific date
  static async getMealsForDate(date?: string) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await NutritionAPI.getMeals(token, date);
      return response;
    } catch (error) {
      console.error('Get meals error:', error);
      return { success: false, error: 'Failed to fetch meals' };
    }
  }

  // Get daily nutrition stats
  static async getDailyNutritionStats(date: string) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await NutritionAPI.getDailyStats(token, date);
      return response;
    } catch (error) {
      console.error('Get daily stats error:', error);
      return { success: false, error: 'Failed to fetch daily stats' };
    }
  }

  // Helper function to convert file to base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// User Requests Examples
export class UserRequests {
  
  // Update user profile
  static async updateUserProfile(profileData: {
    name?: string;
    username?: string;
    smartWatchConnected?: boolean;
    smartWatchType?: string;
  }) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await UserAPI.updateProfile(token, profileData);
      
      if (response.success && response.user) {
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  // Get user subscription information
  static async getSubscriptionInfo() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await UserAPI.getSubscriptionInfo(token);
      return response;
    } catch (error) {
      console.error('Get subscription info error:', error);
      return { success: false, error: 'Failed to fetch subscription info' };
    }
  }
}

// Utility functions for common patterns
export class RequestUtils {
  
  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  // Get stored user data
  static getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Handle API errors consistently
  static handleApiError(error: any): string {
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  // Format date for API calls
  static formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get today's date in API format
  static getTodayForApi(): string {
    return this.formatDateForApi(new Date());
  }
}

// Example usage in React components:
/*
import { AuthRequests, NutritionRequests, UserRequests } from './api/requests';

// In a sign-in component
const handleSignIn = async (email: string, password: string) => {
  const result = await AuthRequests.signInUser({ email, password });
  if (result.success) {
    setUser(result.user);
    navigate('/dashboard');
  } else {
    setError(result.error);
  }
};

// In a meal analysis component
const handleImageUpload = async (file: File) => {
  setLoading(true);
  const result = await NutritionRequests.analyzeMealImage(file);
  if (result.success) {
    setMealData(result.meal);
  } else {
    setError(result.error);
  }
  setLoading(false);
};

// In a profile component
const handleProfileUpdate = async (profileData: any) => {
  const result = await UserRequests.updateUserProfile(profileData);
  if (result.success) {
    setUser(result.user);
    showSuccessMessage('Profile updated successfully');
  } else {
    setError(result.error);
  }
};
*/
