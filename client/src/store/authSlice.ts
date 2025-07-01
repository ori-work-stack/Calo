import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, SignUpData, SignInData, AuthResponse } from "../types";
import { authAPI } from "../services/api";
import * as Keychain from "react-native-keychain";

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
        // Store securely in device keychain
        await Keychain.setInternetCredentials(
          "myapp_auth",
          "token",
          response.token
        );
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
        // Store securely in device keychain (FIXED: was using AsyncStorage)
        await Keychain.setInternetCredentials(
          "myapp_auth",
          "token",
          response.token
        );
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

// Updated signOut with proper keychain cleanup only
export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await Keychain.resetInternetCredentials({ server: "myapp_auth" });
      return true;
    } catch (error) {
      console.error("SignOut error:", error);
      try {
        await Keychain.resetInternetCredentials({ server: "myapp_auth" });
      } catch {}
      return rejectWithValue(
        error instanceof Error ? error.message : "SignOut failed"
      );
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  "auth/loadStoredAuth",
  async (_, { rejectWithValue }) => {
    try {
      const credentials = await Keychain.getInternetCredentials("myapp_auth");
      if (credentials && credentials.password) {
        // Return the token, not the credentials object
        return credentials.password;
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to load stored auth");
    }
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
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // FIXED: action.payload is now the token string, not credentials object
          state.token = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, forceSignOut } = authSlice.actions;
export default authSlice.reducer;
