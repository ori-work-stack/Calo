import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  authAPI,
  nutritionAPI,
  calendarAPI,
  userAPI,
} from "@/src/services/api";
import { MealAnalysisData, Meal } from "@/src/types";
import { deviceAPI } from "@/src/services/deviceAPI";

// Query Keys
export const queryKeys = {
  auth: ["auth"] as const,
  meals: ["meals"] as const,
  meal: (id: string) => ["meal", id] as const,
  dailyStats: (date: string) => ["dailyStats", date] as const,
  globalStats: ["globalStats"] as const,
  calendar: (year: number, month: number) => ["calendar", year, month] as const,
  calendarStats: (year: number, month: number) =>
    ["calendarStats", year, month] as const,
  devices: ["devices"] as const,
  activityData: (date: string) => ["activityData", date] as const,
  dailyBalance: (date: string) => ["dailyBalance", date] as const,
} as const;

// Auth Hooks
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.signIn,
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.signOut,
    onSuccess: () => {
      // Clear all queries on sign out
      queryClient.clear();
    },
  });
}

// Meal Hooks
export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals,
    queryFn: nutritionAPI.getMeals,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAnalyzeMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageBase64: string) => nutritionAPI.analyzeMeal(imageBase64),
    onSuccess: () => {
      // Don't invalidate meals here as we haven't saved yet
    },
  });
}

export function useSaveMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealData,
      imageBase64,
    }: {
      mealData: MealAnalysisData;
      imageBase64?: string;
    }) => nutritionAPI.saveMeal(mealData, imageBase64),
    onSuccess: (data, variables) => {
      // Add the new meal to the cache optimistically
      queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
        if (!old) return [data];
        return [data, ...old];
      });

      // Invalidate related queries
      const today = new Date().toISOString().split("T")[0];
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyStats(today) });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealId,
      updateText,
    }: {
      mealId: string;
      updateText: string;
    }) => nutritionAPI.updateMeal(mealId, updateText),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        // Update the meal in the cache
        queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
          if (!old) return [response.data];
          return old.map((meal) =>
            meal.meal_id?.toString() === variables.mealId ||
            meal.id === variables.mealId
              ? response.data
              : meal
          );
        });

        // Invalidate daily stats
        const today = new Date().toISOString().split("T")[0];
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyStats(today),
        });
      }
    },
  });
}

export function useDuplicateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mealId, newDate }: { mealId: string; newDate?: string }) =>
      nutritionAPI.duplicateMeal(mealId, newDate),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Add duplicated meal to cache
        queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
          if (!old) return [response.data];
          return [response.data, ...old];
        });

        // Invalidate daily stats for the target date
        const targetDate =
          response.data.upload_time?.split("T")[0] ||
          new Date().toISOString().split("T")[0];
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyStats(targetDate),
        });
      }
    },
  });
}

export function useToggleMealFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealId: string) => nutritionAPI.toggleMealFavorite(mealId),
    onMutate: async (mealId) => {
      // Optimistically update the cache
      await queryClient.cancelQueries({ queryKey: queryKeys.meals });

      const previousMeals = queryClient.getQueryData<Meal[]>(queryKeys.meals);

      queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
        if (!old) return old;
        return old.map((meal) =>
          meal.meal_id?.toString() === mealId || meal.id === mealId
            ? { ...meal, isFavorite: !meal.isFavorite }
            : meal
        );
      });

      return { previousMeals };
    },
    onError: (err, mealId, context) => {
      // Revert on error
      if (context?.previousMeals) {
        queryClient.setQueryData(queryKeys.meals, context.previousMeals);
      }
    },
  });
}

export function useSaveMealFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealId,
      feedback,
    }: {
      mealId: string;
      feedback: {
        tasteRating?: number;
        satietyRating?: number;
        energyRating?: number;
        heavinessRating?: number;
      };
    }) => nutritionAPI.saveMealFeedback(mealId, feedback),
    onSuccess: (data, variables) => {
      // Update meal in cache with new feedback
      queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
        if (!old) return old;
        return old.map((meal) =>
          meal.meal_id?.toString() === variables.mealId ||
          meal.id === variables.mealId
            ? { ...meal, ...variables.feedback }
            : meal
        );
      });
    },
  });
}

// Daily Stats Hook
export function useDailyStats(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyStats(date),
    queryFn: () => nutritionAPI.getDailyStats(date),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Global Stats Hook
export function useGlobalStats() {
  return useQuery({
    queryKey: queryKeys.globalStats,
    queryFn: userAPI.getGlobalStatistics,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Calendar Hooks
export function useCalendarData(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.calendar(year, month),
    queryFn: () => calendarAPI.getCalendarData(year, month),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useCalendarStats(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.calendarStats(year, month),
    queryFn: () => calendarAPI.getStatistics(year, month),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      date,
      title,
      type,
    }: {
      date: string;
      title: string;
      type: string;
    }) => calendarAPI.addEvent(date, title, type),
    onSuccess: (data, variables) => {
      // Invalidate calendar data for the relevant month
      const eventDate = new Date(variables.date);
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendar(
          eventDate.getFullYear(),
          eventDate.getMonth() + 1
        ),
      });
    },
  });
}

// Device Hooks
export function useConnectedDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () => deviceAPI.getConnectedDevices(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useConnectDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceType: string) => deviceAPI.connectDevice(deviceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useSyncDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => deviceAPI.syncDevice(deviceId),
    onSuccess: (success, deviceId) => {
      if (success) {
        // Invalidate activity data and balance for today
        const today = new Date().toISOString().split("T")[0];
        queryClient.invalidateQueries({
          queryKey: queryKeys.activityData(today),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyBalance(today),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      }
    },
  });
}

export function useActivityData(date: string) {
  return useQuery({
    queryKey: queryKeys.activityData(date),
    queryFn: () => deviceAPI.getActivityData(date),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useDailyBalance(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyBalance(date),
    queryFn: () => deviceAPI.getDailyBalance(date),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useDisconnectDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => deviceAPI.disconnectDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useSyncAllDevices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deviceAPI.syncAllDevices(),
    onSuccess: () => {
      const today = new Date().toISOString().split("T")[0];
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({
        queryKey: queryKeys.activityData(today),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dailyBalance(today),
      });
    },
  });
}
