import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { loadStoredAuth } from "@/src/store/authSlice";
import { loadPendingMeal } from "@/src/store/mealSlice";

export function useAppInitialization() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize app data
    dispatch(loadStoredAuth());
    dispatch(loadPendingMeal());
  }, [dispatch]);
}
