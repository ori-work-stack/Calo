import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import { loadStoredAuth } from "@/src/store/authSlice";
import { loadPendingMeal } from "@/src/store/mealSlice";

export default function Index() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
    dispatch(loadPendingMeal());
  }, [dispatch]);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/signin" />;
}
