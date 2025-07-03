import { queryClient } from "../providers/QueryProvider";
import { queryKeys } from "@/hooks/useQueries";
import { nutritionAPI, calendarAPI, userAPI } from "./api";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { deviceAPI } from "@/src/services/deviceAPI";

const BACKGROUND_SYNC_TASK = "background-sync";

// Background task definition
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log("🔄 Running background sync...");

    const today = new Date().toISOString().split("T")[0];

    // Prefetch critical data
    await Promise.allSettled([
      // Sync device data
      deviceAPI.syncAllDevices(),

      // Prefetch today's nutrition data
      queryClient.prefetchQuery({
        queryKey: queryKeys.dailyStats(today),
        queryFn: () => nutritionAPI.getDailyStats(today),
        staleTime: 1000 * 60 * 5, // 5 minutes
      }),

      // Prefetch meals if stale
      queryClient.prefetchQuery({
        queryKey: queryKeys.meals,
        queryFn: () => nutritionAPI.getMeals,
        staleTime: 1000 * 60 * 10, // 10 minutes
      }),
    ]);

    console.log("✅ Background sync completed");
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("💥 Background sync failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundSyncService {
  private isRegistered = false;

  async initialize() {
    try {
      if (this.isRegistered) {
        console.log("⚠️ Background sync already registered");
        return;
      }

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 1000 * 60 * 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isRegistered = true;
      console.log("✅ Background sync registered");
    } catch (error) {
      console.error("💥 Failed to register background sync:", error);
    }
  }

  async unregister() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
      console.log("🗑️ Background sync unregistered");
    } catch (error) {
      console.error("💥 Failed to unregister background sync:", error);
    }
  }

  // Manual sync trigger
  async syncNow() {
    try {
      console.log("🔄 Manual sync triggered...");

      const today = new Date().toISOString().split("T")[0];

      // Invalidate and refetch critical data
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.meals }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dailyStats(today),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.devices }),
        deviceAPI.syncAllDevices(),
      ]);

      console.log("✅ Manual sync completed");
    } catch (error) {
      console.error("💥 Manual sync failed:", error);
      throw error;
    }
  }

  // Prefetch data for better UX
  async prefetchCommonData() {
    try {
      console.log("⚡ Prefetching common data...");

      const today = new Date().toISOString().split("T")[0];
      const currentDate = new Date();

      await Promise.allSettled([
        // Prefetch today's data
        queryClient.prefetchQuery({
          queryKey: queryKeys.dailyStats(today),
          queryFn: () => nutritionAPI.getDailyStats(today),
        }),

        // Prefetch global stats
        queryClient.prefetchQuery({
          queryKey: queryKeys.globalStats,
          queryFn: userAPI.getGlobalStatistics,
        }),

        // Prefetch current month calendar
        queryClient.prefetchQuery({
          queryKey: queryKeys.calendar(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1
          ),
          queryFn: () =>
            calendarAPI.getCalendarData(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1
            ),
        }),

        // Prefetch devices
        queryClient.prefetchQuery({
          queryKey: queryKeys.devices,
          queryFn: deviceAPI.getConnectedDevices,
        }),
      ]);

      console.log("✅ Common data prefetched");
    } catch (error) {
      console.error("💥 Prefetch failed:", error);
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService();
