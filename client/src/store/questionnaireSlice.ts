import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { QuestionnaireData } from "../types";
import { api } from "../services/api";
import { setQuestionnaireCompleted } from "./authSlice";

interface QuestionnaireState {
  questionnaire: QuestionnaireData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: QuestionnaireState = {
  questionnaire: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchQuestionnaire = createAsyncThunk(
  "questionnaire/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/questionnaire");
      return response.data.questionnaire;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch questionnaire"
      );
    }
  }
);

export const saveQuestionnaire = createAsyncThunk(
  "questionnaire/save",
  async (
    questionnaireData: QuestionnaireData,
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await api.post("/questionnaire", questionnaireData);
      // Update auth slice to mark questionnaire as completed
      dispatch(setQuestionnaireCompleted());
      return response.data.questionnaire;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to save questionnaire"
      );
    }
  }
);

const questionnaireSlice = createSlice({
  name: "questionnaire",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateQuestionnaireData: (
      state,
      action: PayloadAction<Partial<QuestionnaireData>>
    ) => {
      if (state.questionnaire) {
        state.questionnaire = { ...state.questionnaire, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questionnaire
      .addCase(fetchQuestionnaire.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestionnaire.fulfilled, (state, action) => {
        state.isLoading = false;
        state.questionnaire = action.payload;
      })
      .addCase(fetchQuestionnaire.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save questionnaire
      .addCase(saveQuestionnaire.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveQuestionnaire.fulfilled, (state, action) => {
        state.isSaving = false;
        state.questionnaire = action.payload;
      })
      .addCase(saveQuestionnaire.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateQuestionnaireData } =
  questionnaireSlice.actions;
export default questionnaireSlice.reducer;
