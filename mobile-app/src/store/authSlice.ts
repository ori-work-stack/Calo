import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, SignUpData, SignInData, AuthResponse } from "../types";
import { authAPI } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (data: SignUpData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signUp(data);
      if (response.success && response.token) {
        await AsyncStorage.setItem("token", response.token);
        return response;
      }
      return rejectWithValue(response.error || "Signup failed");
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Signup failed"
      );
    }
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (data: SignInData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signIn(data);
      if (response.success && response.token) {
        await AsyncStorage.setItem("token", response.token);
        return response;
      }
      return rejectWithValue(response.error || "Login failed");
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

// Updated signOut with proper error handling and API call
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      // Add API call if your server has a signout endpoint
      // await authAPI.signOut();

      // Remove token from AsyncStorage
      await AsyncStorage.removeItem("token");

      return true;
    } catch (error) {
      console.error("SignOut error:", error);
      // Even if API call fails, we still want to clear local storage
      await AsyncStorage.removeItem("token");
      return rejectWithValue(
        error instanceof Error ? error.message : "SignOut failed"
      );
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  "auth/loadStoredAuth",
  async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      // You might want to validate the token with the server here
      return token;
    }
    return null;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Add manual signout reducer as fallback
    forceSignOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Updated signOut cases
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(signOut.rejected, (state, action) => {
        // Even if signout fails, clear the local state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, forceSignOut } = authSlice.actions;
export default authSlice.reducer;
