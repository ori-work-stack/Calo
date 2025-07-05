import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./useQueries";

export function useBackgroundRefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refetchStaleData = () => {
      const today = new Date().toISOString().split("T")[0];

      // Refetch critical queries that might be stale
      queryClient.refetchQueries({
        queryKey: queryKeys.meals,
        type: "active",
        stale: true,
      });

      queryClient.refetchQueries({
        queryKey: queryKeys.dailyStats(today),
        type: "active",
        stale: true,
      });
    };

    // Set up periodic background refresh every 5 minutes
    const intervalId = setInterval(refetchStaleData, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [queryClient]);
}
