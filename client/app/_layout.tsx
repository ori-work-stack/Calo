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
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
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

  // 🎯 Splash hide
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 🎯 Auth + Subscription Routing
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

    if (!user.subscription_type && !onPaymentPlan) {
      router.replace("/payment-plan");
      return;
    }

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

    if (
      user.subscription_type &&
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      user.is_questionnaire_completed &&
      !inTabsGroup
    ) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, user, segments, router]);

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
