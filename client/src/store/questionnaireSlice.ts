import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { QuestionnaireData } from "../types";
import { questionnaireAPI } from "../services/api";
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
      const response = await questionnaireAPI.getQuestionnaire();
      const data = response.data?.data || response.data;

      // If no questionnaire data found, return null instead of throwing error
      if (!data && response.data?.message === "No questionnaire found") {
        return null;
      }

      return data;
    } catch (error: any) {
      console.error("Fetch questionnaire error:", error);
      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch questionnaire"
      );
    }
  }
);

export const saveQuestionnaire = createAsyncThunk(
  "questionnaire/save",
  async (
    questionnaireData: QuestionnaireData & { isEditMode?: boolean },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const state = getState() as { questionnaire: QuestionnaireState };
      const existingQuestionnaire = state.questionnaire.questionnaire;

      // If in edit mode and we have existing data, merge the changes
      let dataToSave = questionnaireData;
      if (questionnaireData.isEditMode && existingQuestionnaire) {
        // Merge existing data with new data, keeping unchanged fields
        dataToSave = {
          ...existingQuestionnaire,
          ...questionnaireData,
          // Preserve the edit mode flag
          isEditMode: questionnaireData.isEditMode,
        };
      }

      const response = await questionnaireAPI.saveQuestionnaire(dataToSave);

      // Only update questionnaire completion status if not in edit mode
      if (!questionnaireData.isEditMode) {
        dispatch(setQuestionnaireCompleted());
      }

      return response.data?.questionnaire || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.message ||
          "Failed to save questionnaire"
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
