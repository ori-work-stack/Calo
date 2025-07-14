import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

interface AppInitializationState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userProfile: any;
  error: string | null;
}

export const useAppInitialization = (): AppInitializationState => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Initialize app settings
  const { data: appSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["appInitialization"],
    queryFn: async () => {
      try {
        // Load saved language
        const savedLanguage = await AsyncStorage.getItem("@userLanguage");
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage);
        }

        // Load authentication state
        const authToken = await AsyncStorage.getItem("authToken");
        const isAuthenticated = !!authToken;

        return {
          language: savedLanguage,
          isAuthenticated,
          authToken,
        };
      } catch (error) {
        throw new Error("Failed to initialize app");
      }
    },
    staleTime: Infinity, // App initialization only happens once
    retry: 3,
  });

  // Load user profile if authenticated
  const {
    data: userProfile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { userAPI } = await import("../src/services/api");
      return userAPI.getUserProfile();
    },
    enabled: !!appSettings?.isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  return {
    isLoading: settingsLoading || profileLoading,
    isAuthenticated: appSettings?.isAuthenticated || false,
    userProfile,
    error: error?.message || null,
  };
};

export default useAppInitialization;
