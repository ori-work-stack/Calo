import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { fetchMeals } from "@/src/store/mealSlice";
import { queryClient } from "@/src/services/queryClient";

export const useMealDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();

  const refreshAllMealData = useCallback(async () => {
    try {
      // Refresh Redux meal data
      await dispatch(fetchMeals());

      // Invalidate and refetch React Query cache for meal-related data
      await queryClient.invalidateQueries({ queryKey: ["meals"] });
      await queryClient.invalidateQueries({ queryKey: ["statistics"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      await queryClient.invalidateQueries({ queryKey: ["recent-meals"] });
      await queryClient.invalidateQueries({ queryKey: ["nutrition"] });
      await queryClient.invalidateQueries({ queryKey: ["recommended-menus"] });

      console.log("✅ All meal-related data refreshed");
    } catch (error) {
      console.error("❌ Error refreshing meal data:", error);
    }
  }, [dispatch]);

  return { refreshAllMealData };
};
