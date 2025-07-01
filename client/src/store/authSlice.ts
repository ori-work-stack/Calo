import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, SignUpData, SignInData, AuthResponse } from "../types";
import { authAPI } from "../services/api";

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
      console.log("🔄 Starting sign up process...");
      const response = await authAPI.signUp(data);
      if (response.success && response.token) {
        console.log("✅ Sign up successful");
        return response;
      }
      return rejectWithValue(response.error || "Signup failed");
    } catch (error) {
      console.error("💥 Sign up error:", error);
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
      console.log("🔄 Starting sign in process...");
      const response = await authAPI.signIn(data);
      if (response.success && response.token) {
        console.log("✅ Sign in successful");
        return response;
      }
      return rejectWithValue(response.error || "Login failed");
    } catch (error) {
      console.error("💥 Sign in error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  }
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Starting sign out process...");
      await authAPI.signOut();
      console.log("✅ Sign out successful");
      return true;
    } catch (error) {
      console.error("💥 SignOut error:", error);
      // Even if there's an error, try to clear the token
      try {
        await authAPI.signOut();
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
      console.log("🔄 Loading stored auth...");
      const token = await authAPI.getStoredToken();
      if (token) {
        console.log("✅ Found stored token");
        return token;
      }
      console.log("ℹ️ No stored token found");
      return null;
    } catch (error) {
      console.error("💥 Load stored auth error:", error);
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
      console.log("🔄 Force sign out");
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
        console.log("✅ Sign up state updated");
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("❌ Sign up failed:", action.payload);
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
        console.log("✅ Sign in state updated");
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("❌ Sign in failed:", action.payload);
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
        console.log("✅ Sign out state updated");
      })
      .addCase(signOut.rejected, (state, action) => {
        // Even if signout fails, clear the local state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("⚠️ Sign out failed but state cleared:", action.payload);
      })
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload;
          state.isAuthenticated = true;
          console.log("✅ Stored auth loaded");
        } else {
          console.log("ℹ️ No stored auth found");
        }
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("❌ Load stored auth failed:", action.payload);
      });
  },
});

export const { clearError, forceSignOut } = authSlice.actions;
export default authSlice.reducer;
