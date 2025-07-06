import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppInitialization } from "@/hooks/useAppInitialization";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { queryClient } from "@/src/providers/QueryProvider";

function AppContent() {
  useAppInitialization();

  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const onPaymentPlan = segments.some(
      (segment) => segment === "payment-plan"
    );
    const onQuestionnaire = segments.some(
      (segment) => segment === "questionnaire"
    );

    // If user is not authenticated, redirect to auth
    if (!isAuthenticated || !user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/signin");
      }
      return;
    }

    // User is authenticated - handle the flow

    // If user just signed up and hasn't selected a plan, go to payment plan
    if (!user.subscription_type && !onPaymentPlan) {
      router.replace("/payment-plan");
      return;
    }

    // If user has PREMIUM or GOLD plan but hasn't completed questionnaire
    if (
      user.subscription_type &&
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      !user.is_questionnaire_completed &&
      !onQuestionnaire
    ) {
      router.replace("/questionnaire");
      return;
    }

    // If user has completed questionnaire or has FREE plan, allow access to tabs
    if (
      user.subscription_type &&
      (user.subscription_type === "FREE" || user.is_questionnaire_completed) &&
      !inTabsGroup
    ) {
      router.replace("/(tabs)");
      return;
    }
  }, [isAuthenticated, user, segments, router]);

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
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <AppContent />
            <StatusBar style="auto" />
          </PersistGate>
        </QueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
