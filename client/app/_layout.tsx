import { Stack } from "expo-router";
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
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { queryClient } from "@/src/providers/QueryProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/src/i18n"; // Initialize i18n
import { LanguageProvider } from "@/src/i18n/context/LanguageContext";

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

    if (!isAuthenticated || !user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/signin");
      }
      return;
    }

    // Always redirect to payment plan if no subscription
    if (!user.subscription_type && !onPaymentPlan) {
      router.replace("/payment-plan");
      return;
    }

    // Block access to main app for FREE subscription users
    if (user.subscription_type === "FREE" && !onPaymentPlan) {
      router.replace("/payment-plan");
      return;
    }

    // Require questionnaire completion for premium users
    if (
      user.subscription_type &&
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      !user.is_questionnaire_completed &&
      !onQuestionnaire &&
      !onPaymentPlan
    ) {
      router.replace("/questionnaire");
      return;
    }

    // Only allow access to main app if premium subscription and questionnaire completed
    if (
      user.subscription_type &&
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      user.is_questionnaire_completed &&
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
