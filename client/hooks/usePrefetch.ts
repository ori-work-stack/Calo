import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueries";
import { nutritionAPI, userAPI } from "@/src/services/api";

export function usePrefetchData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchCriticalData = async () => {
      const today = new Date().toISOString().split("T")[0];

      try {
        // Prefetch meals (most important)
        queryClient.prefetchQuery({
          queryKey: queryKeys.meals,
          queryFn: () => nutritionAPI.getMeals(),
          staleTime: 1000 * 60 * 15, // 15 minutes
        });

        // Prefetch today's stats
        queryClient.prefetchQuery({
          queryKey: queryKeys.dailyStats(today),
          queryFn: () => nutritionAPI.getDailyStats(today),
          staleTime: 1000 * 60 * 10, // 10 minutes
        });

        console.log("✅ Critical data prefetched successfully");
      } catch (error) {
        console.warn("⚠️ Some prefetch operations failed:", error);
      }
    };

    // Prefetch immediately
    prefetchCriticalData();
  }, [queryClient]);
}
