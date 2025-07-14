import { SplashScreen, Stack } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useRouter, useSegments, useNavigationContainerRef } from "expo-router";
import { useEffect, useState } from "react";
import { queryClient } from "@/src/providers/QueryProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/src/i18n"; // Initialize i18n
import { LanguageProvider } from "@/src/i18n/context/LanguageContext";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import { I18nextProvider } from "react-i18next";
import { useColorScheme } from "@/hooks/useColorScheme";
import i18n from "@/src/i18n";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  // 🚨 ALL HOOKS FIRST — NO CONDITIONAL RETURNS BEFORE HOOKS
  useAppInitialization();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();
  const segments = useSegments();

  // Track navigation state to prevent loops
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  const [lastNavigationKey, setLastNavigationKey] = useState("");

  // Reset navigation attempts when user changes
  useEffect(() => {
    setNavigationAttempts(0);
    setIsNavigating(false);
    setLastNavigationKey("");
  }, [isAuthenticated, user?.email]);

  // 🎯 Splash hide
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 🎯 Auth + Subscription Routing - Stable navigation logic
  useEffect(() => {
    if (!loaded) return;

    // Create a unique key for this navigation state
    const navigationKey = `${isAuthenticated}-${user?.email_verified}-${user?.subscription_type}-${user?.is_questionnaire_completed}`;

    // Skip if we've already processed this exact state
    if (navigationKey === lastNavigationKey) {
      return;
    }

    const currentPath = segments[0];
    const inAuthGroup = currentPath === "(auth)";
    const inTabsGroup = currentPath === "(tabs)";
    const onPaymentPlan = currentPath === "payment-plan";
    const onQuestionnaire = currentPath === "questionnaire";
    const onEmailVerification =
      inAuthGroup && segments[1] === "email-verification";

    console.log("Navigation effect triggered:", {
      loaded,
      isAuthenticated,
      user: user?.email,
      currentPath,
      userEmailVerified: user?.email_verified,
      userSubscriptionType: user?.subscription_type,
      userQuestionnaireCompleted: user?.is_questionnaire_completed,
      navigationKey,
      lastNavigationKey,
    });

    // Update the last navigation key
    setLastNavigationKey(navigationKey);

    // Not authenticated - go to signin
    if (!isAuthenticated || !user) {
      if (!inAuthGroup && !onEmailVerification && !onPaymentPlan) {
        console.log("Navigating to signin - not authenticated");
        router.replace("/(auth)/signin");
      }
      return;
    }

    // Email not verified - go to verification
    if (user.email_verified === false) {
      if (!onEmailVerification) {
        console.log("Navigating to email verification - email not verified");
        router.replace(`/(auth)/email-verification?email=${user.email}`);
      }
      return;
    }

    // No subscription - go to payment plan
    if (!user.subscription_type) {
      if (!onPaymentPlan) {
        console.log("Navigating to payment plan - no subscription");
        router.replace("/payment-plan");
      }
      return;
    }

    // Premium/Gold without questionnaire - go to questionnaire
    if (
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      !user.is_questionnaire_completed
    ) {
      if (!onQuestionnaire) {
        console.log(
          "Navigating to questionnaire - premium/gold without questionnaire"
        );
        router.replace("/questionnaire");
      }
      return;
    }

    // All checks passed - already on main app, no need to navigate
    if (inTabsGroup) {
      console.log("Already on main app - no navigation needed");
      return;
    }

    // Navigate to main app only if not already there
    console.log("Navigating to main app - all checks passed");
    router.replace("/(tabs)");
  }, [
    loaded,
    isAuthenticated,
    user?.email_verified,
    user?.subscription_type,
    user?.is_questionnaire_completed,
    lastNavigationKey,
    // Removed segments from dependencies to prevent infinite loops
  ]);

  // ✅ DO CONDITIONAL RETURN *AFTER* ALL HOOKS
  if (!loaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="payment-plan" />
      <Stack.Screen name="questionnaire" />
    </Stack>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ marginTop: 10 }}>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <PersistGate loading={<LoadingScreen />} persistor={persistor}>
                <LanguageProvider>
                  <AppContent />
                  <StatusBar style="auto" />
                </LanguageProvider>
              </PersistGate>
            </QueryClientProvider>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
