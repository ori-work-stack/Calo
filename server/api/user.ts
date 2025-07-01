export interface UpdateProfileData {
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  subscription_type: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  aiRequestsCount: number;
  createdAt: string;
}

export interface UserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface SubscriptionInfo {
  plan: string;
  isActive: boolean;
  expiresAt?: string;
  aiRequestsLimit: number;
  aiRequestsUsed: number;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: SubscriptionInfo;
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:5000/api';

export class UserAPI {
  private static getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  static async updateProfile(token: string, data: UpdateProfileData): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    
    return response.json();
  }

  static async getSubscriptionInfo(token: string): Promise<SubscriptionResponse> {
    const response = await fetch(`${API_BASE_URL}/user/subscription`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    
    return response.json();
  }
}