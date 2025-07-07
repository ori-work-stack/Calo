import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { calendarAPI } from "../services/api";

interface DayData {
  date: string;
  calories_goal: number;
  calories_actual: number;
  protein_goal: number;
  protein_actual: number;
  carbs_goal: number;
  carbs_actual: number;
  fat_goal: number;
  fat_actual: number;
  meal_count: number;
  quality_score: number;
  events: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

interface CalendarStats {
  monthlyProgress: number;
  streakDays: number;
  bestWeek: string;
  challengingWeek: string;
  improvementPercent: number;
  totalGoalDays: number;
  averageCalories: number;
  averageProtein: number;
  motivationalMessage: string;
}

interface CalendarState {
  calendarData: Record<string, DayData>;
  statistics: CalendarStats | null;
  isLoading: boolean;
  isAddingEvent: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  calendarData: {},
  statistics: null,
  isLoading: false,
  isAddingEvent: false,
  error: null,
};

export const fetchCalendarData = createAsyncThunk(
  "calendar/fetchCalendarData",
  async (
    { year, month }: { year: number; month: number },
    { rejectWithValue }
  ) => {
    try {
      console.log("📅 Fetching calendar data for:", year, month);
      const data = await calendarAPI.getCalendarData(year, month);
      return data;
    } catch (error) {
      console.error("💥 Calendar data fetch error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch calendar data"
      );
    }
  }
);

export const getStatistics = createAsyncThunk(
  "calendar/getStatistics",
  async (
    { year, month }: { year: number; month: number },
    { rejectWithValue }
  ) => {
    try {
      console.log("📊 Fetching statistics for:", year, month);
      const stats = await calendarAPI.getStatistics(year, month);
      return stats;
    } catch (error) {
      console.error("💥 Statistics fetch error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch statistics"
      );
    }
  }
);

export const addEvent = createAsyncThunk(
  "calendar/addEvent",
  async (
    { date, title, type }: { date: string; title: string; type: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("📝 Adding event:", { date, title, type });
      const event = await calendarAPI.addEvent(date, title, type);
      return { date, event };
    } catch (error) {
      console.error("💥 Add event error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add event"
      );
    }
  }
);

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch calendar data
      .addCase(fetchCalendarData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCalendarData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.calendarData = action.payload;
        state.error = null;
      })
      .addCase(fetchCalendarData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Get statistics
      .addCase(getStatistics.pending, (state) => {
        // Don't set loading for statistics to avoid UI flicker
      })
      .addCase(getStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(getStatistics.rejected, (state, action) => {
        console.warn("Statistics fetch failed:", action.payload);
      })

      // Add event
      .addCase(addEvent.pending, (state) => {
        state.isAddingEvent = true;
        state.error = null;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.isAddingEvent = false;
        const { date, event } = action.payload;

        // Add event to the calendar data
        if (state.calendarData[date]) {
          state.calendarData[date].events.push(event);
        }
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.isAddingEvent = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = calendarSlice.actions;
export default calendarSlice.reducer;
