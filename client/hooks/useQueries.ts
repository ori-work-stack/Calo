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
    queryFn: () => nutritionAPI.getMeals(), // Wrap in arrow function
    staleTime: 1000 * 60 * 15, // 15 minutes - longer cache
    select: (data: Meal[]) => {
      // Sort meals by upload_time for consistent ordering
      return (
        data?.sort(
          (a: Meal, b: Meal) =>
            new Date(b.upload_time || 0).getTime() -
            new Date(a.upload_time || 0).getTime()
        ) || []
      );
    },
  });
}

export function useMealsInfinite(limit = 20) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.meals, "infinite"],
    queryFn: ({ pageParam = 0 }) => nutritionAPI.getMeals(pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < limit) return undefined;
      return pages.length * limit;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    initialPageParam: 0,
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
    onMutate: async ({ mealData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.meals });

      // Snapshot the previous value
      const previousMeals = queryClient.getQueryData<Meal[]>(queryKeys.meals);

      // Generate a temporary numeric ID for meal_id
      const tempId = Date.now();
      // Optimistically update to the new value
      const optimisticMeal: Meal = {
        // Primary fields matching Prisma schema
        meal_id: tempId,
        id: `temp-${tempId}`,
        user_id: "temp-user",
        image_url: "",
        upload_time: new Date().toISOString(),
        analysis_status: "COMPLETED" as const,
        meal_name: mealData.name || "New Meal",
        calories: mealData.calories || 0,
        protein_g: mealData.protein || 0,
        carbs_g: mealData.carbs || 0,
        fats_g: mealData.fat || 0,
        fiber_g: mealData.fiber || null,
        sugar_g: mealData.sugar || null,
        sodium_mg: mealData.sodium || null,
        created_at: new Date().toISOString(),

        // Computed fields for compatibility
        name: mealData.name || "New Meal",
        description: mealData.description,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fat: mealData.fat || 0,
        fiber: mealData.fiber,
        sugar: mealData.sugar,
        sodium: mealData.sodium,
        userId: "temp-user",
      };

      queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
        if (!old) return [optimisticMeal];
        return [optimisticMeal, ...old];
      });

      return { previousMeals };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic update with real data
      queryClient.setQueryData<Meal[]>(queryKeys.meals, (old) => {
        if (!old) return [data];
        return [data, ...old.slice(1)]; // Remove the optimistic meal and add real one
      });

      // Invalidate related queries for fresh data
      const today = new Date().toISOString().split("T")[0];
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyStats(today) });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalStats });

      // Also invalidate calendar data for today
      const currentDate = new Date();
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendar(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        ),
      });
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMeals) {
        queryClient.setQueryData(queryKeys.meals, context.previousMeals);
      }
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
