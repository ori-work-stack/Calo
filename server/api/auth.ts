export interface SignUpData {
  email: string;
  name: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    user_id: string;
    email: string;
    name: string;
    subscription_type: string;
    aiRequestsCount: number;
    // smartWatchConnected: boolean;
    // smartWatchType: string | null;
    createdAt: string;
  };
  token?: string;
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://0.0.0.0:5000/api";

export class AuthAPI {
  private static getHeaders(token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  static async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  static async signIn(data: SignInData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  static async getMe(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    return response.json();
  }

  static async signOut(
    token: string
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/signout`, {
      method: "POST",
      headers: this.getHeaders(token),
    });

    return response.json();
  }
}
