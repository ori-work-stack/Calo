
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Meal, MealAnalysisData, PendingMeal, AIResponse } from '../types';
import { nutritionAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealState {
  meals: Meal[];
  pendingMeal: PendingMeal | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  isPosting: boolean;
  error: string | null;
}

const initialState: MealState = {
  meals: [],
  pendingMeal: null,
  isLoading: false,
  isAnalyzing: false,
  isPosting: false,
  error: null,
};

const PENDING_MEAL_KEY = 'pendingMeal';

export const analyzeMeal = createAsyncThunk(
  'meal/analyzeMeal',
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const response = await nutritionAPI.analyzeMeal(imageUri);
      if (response.success && response.data) {
        const pendingMeal: PendingMeal = {
          imageUri,
          analysis: response.data,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(PENDING_MEAL_KEY, JSON.stringify(pendingMeal));
        return pendingMeal;
      }
      return rejectWithValue(response.error || 'Analysis failed');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Analysis failed');
    }
  }
);

export const postMeal = createAsyncThunk(
  'meal/postMeal',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { meal: MealState };
      const { pendingMeal } = state.meal;
      
      if (!pendingMeal) {
        return rejectWithValue('No pending meal to post');
      }

      const response = await nutritionAPI.saveMeal(pendingMeal.analysis, pendingMeal.imageUri);
      if (response) {
        await AsyncStorage.removeItem(PENDING_MEAL_KEY);
        return response;
      }
      return rejectWithValue('Failed to post meal');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to post meal');
    }
  }
);

export const fetchMeals = createAsyncThunk(
  'meal/fetchMeals',
  async (_, { rejectWithValue }) => {
    try {
      return await nutritionAPI.getMeals();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch meals');
    }
  }
);

export const loadPendingMeal = createAsyncThunk('meal/loadPendingMeal', async () => {
  const stored = await AsyncStorage.getItem(PENDING_MEAL_KEY);
  return stored ? JSON.parse(stored) : null;
});

const mealSlice = createSlice({
  name: 'meal',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPendingMeal: (state) => {
      state.pendingMeal = null;
      AsyncStorage.removeItem(PENDING_MEAL_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeMeal.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeMeal.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.pendingMeal = action.payload;
      })
      .addCase(analyzeMeal.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload as string;
      })
      .addCase(postMeal.pending, (state) => {
        state.isPosting = true;
        state.error = null;
      })
      .addCase(postMeal.fulfilled, (state, action) => {
        state.isPosting = false;
        state.pendingMeal = null;
        state.meals.unshift(action.payload);
      })
      .addCase(postMeal.rejected, (state, action) => {
        state.isPosting = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.meals = action.payload;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadPendingMeal.fulfilled, (state, action) => {
        state.pendingMeal = action.payload;
      });
  },
});

export const { clearError, clearPendingMeal } = mealSlice.actions;
export default mealSlice.reducer;
