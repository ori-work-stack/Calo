import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueries";
import { calendarAPI, nutritionAPI, userAPI } from "@/src/services/api";
import { deviceAPI } from "@/src/services/deviceAPI";

export function usePrefetchData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchCriticalData = async () => {
      const today = new Date().toISOString().split("T")[0];
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      try {
        // Prefetch meals (most important)
        queryClient.prefetchQuery({
          queryKey: queryKeys.meals,
          queryFn: () => nutritionAPI.getMeals(), // Wrap in arrow function with no parameters
          staleTime: 1000 * 60 * 15, // 15 minutes
        });

        // Prefetch today's stats
        queryClient.prefetchQuery({
          queryKey: queryKeys.dailyStats(today),
          queryFn: () => nutritionAPI.getDailyStats(today),
          staleTime: 1000 * 60 * 10, // 10 minutes
        });

        // Prefetch global stats
        queryClient.prefetchQuery({
          queryKey: queryKeys.globalStats,
          queryFn: userAPI.getGlobalStatistics,
          staleTime: 1000 * 60 * 60, // 1 hour
        });

        // Prefetch current month calendar
        queryClient.prefetchQuery({
          queryKey: queryKeys.calendar(year, month),
          queryFn: () => calendarAPI.getCalendarData(year, month),
          staleTime: 1000 * 60 * 15, // 15 minutes
        });

        // Prefetch devices
        queryClient.prefetchQuery({
          queryKey: queryKeys.devices,
          queryFn: () => deviceAPI.getConnectedDevices(),
          staleTime: 1000 * 60 * 5, // 5 minutes
        });

        // Prefetch today's activity and balance
        queryClient.prefetchQuery({
          queryKey: queryKeys.activityData(today),
          queryFn: () => deviceAPI.getActivityData(today),
          staleTime: 1000 * 60 * 15, // 15 minutes
        });

        queryClient.prefetchQuery({
          queryKey: queryKeys.dailyBalance(today),
          queryFn: () => deviceAPI.getDailyBalance(today),
          staleTime: 1000 * 60 * 10, // 10 minutes
        });

        console.log("✅ Critical data prefetched successfully");
      } catch (error) {
        console.warn("⚠️ Some prefetch operations failed:", error);
      }
    };

    // Prefetch immediately
    prefetchCriticalData();

    // Prefetch again after 30 seconds to ensure fresh data
    const timeoutId = setTimeout(prefetchCriticalData, 30000);

    return () => clearTimeout(timeoutId);
  }, [queryClient]);
}
