import {
  ExternalPathString,
  RelativePathString,
  SplashScreen,
  Stack,
  UnknownInputParams,
} from "expo-router";
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
import { useEffect, useMemo, useRef } from "react";
import { queryClient } from "@/src/providers/QueryProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "@/src/i18n"; // Initialize i18n
import { LanguageProvider } from "@/src/i18n/context/LanguageContext";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import { I18nextProvider } from "react-i18next";
import { useColorScheme } from "@/hooks/useColorScheme";
import i18n from "@/src/i18n";
import { User } from "@/src/types";
import LanguageToolbar from "@/components/LanguageToolbar";

SplashScreen.preventAutoHideAsync();

// Memoized selector to prevent unnecessary re-renders
const selectAuthState = (state: RootState) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
});

// Memoized navigation state calculator
function useNavigationState(
  user: User | null,
  isAuthenticated: boolean,
  segments: string[]
) {
  return useMemo(() => {
    const currentPath = segments?.[0] || "";
    const inAuthGroup = currentPath === "(auth)";
    const inTabsGroup = currentPath === "(tabs)";
    const onPaymentPlan = currentPath === "payment-plan";
    const onQuestionnaire = currentPath === "questionnaire";
    const onEmailVerification =
      inAuthGroup && segments?.[1] === "email-verification";

    // Create current route string for comparison
    const currentRoute = "/" + segments.join("/");

    let targetRoute: string | null = null;

    if (!isAuthenticated || !user) {
      if (!inAuthGroup) {
        targetRoute = "/(auth)/signin";
      }
    } else if (user?.email_verified === false && !onEmailVerification) {
      targetRoute = `/(auth)/email-verification?email=${user?.email || ""}`;
    } else if (!user?.subscription_type && !onPaymentPlan) {
      targetRoute = "/payment-plan";
    } else if (
      user?.subscription_type &&
      ["PREMIUM", "GOLD"].includes(user.subscription_type) &&
      !user?.is_questionnaire_completed &&
      !onQuestionnaire
    ) {
      targetRoute = "/questionnaire";
    } else if (
      !inTabsGroup &&
      isAuthenticated &&
      user?.email_verified &&
      user?.subscription_type &&
      (user?.is_questionnaire_completed ||
        !["PREMIUM", "GOLD"].includes(user?.subscription_type || ""))
    ) {
      targetRoute = "/(tabs)";
    }

    return {
      targetRoute,
      currentRoute,
      shouldNavigate: targetRoute !== null && targetRoute !== currentRoute,
    };
  }, [
    user?.email_verified,
    user?.subscription_type,
    user?.is_questionnaire_completed,
    user?.email,
    isAuthenticated,
    segments?.join("/") || "", // Stable string representation
  ]);
}

// Optimized navigation manager
function useNavigationManager(
  targetRoute: string | null,
  currentRoute: string,
  shouldNavigate: boolean,
  loaded: boolean
) {
  const router = useRouter();
  const lastNavigationRef = useRef<string | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (!loaded || !shouldNavigate || !targetRoute || isNavigatingRef.current) {
      return;
    }

    // Prevent duplicate navigations
    if (lastNavigationRef.current === targetRoute) {
      return;
    }

    // Immediate navigation without setTimeout to prevent delays
    isNavigatingRef.current = true;
    lastNavigationRef.current = targetRoute;

    router.replace(targetRoute);

    // Reset navigation flag after a short delay
    const resetTimeout = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);

    return () => {
      clearTimeout(resetTimeout);
    };
  }, [loaded, shouldNavigate, targetRoute, router]);
}

// Memoized loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Memoized stack screens to prevent re-creation
const StackScreens = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(auth)" />
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="payment-plan" />
    <Stack.Screen name="questionnaire" />
  </Stack>
);

const AppContent = () => {
  const authState = useSelector((state: any) => state?.auth || {});
  const questionnaireState = useSelector(
    (state: any) => state?.questionnaire || {}
  );

  const { isAuthenticated = false, user = null } = authState || {};
  const { questionnaire = null } = questionnaireState || {};

  useAppInitialization();

  // Font loading
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Memoized navigation state selector
  const segments = useSegments() as string[];

  // Memoized navigation state
  const navigationState = useNavigationState(user, isAuthenticated, segments);

  // Navigation management
  useNavigationManager(
    navigationState.targetRoute,
    navigationState.currentRoute,
    navigationState.shouldNavigate,
    loaded
  );

  // Splash screen handling
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Early return for loading state
  if (!loaded) {
    return null;
  }

  return <StackScreens />;
};

function useHelpContent(): { title: string; description: string } | undefined {
  const segments = useSegments();
  const route = "/" + segments.join("/");

  switch (route) {
    case "/(tabs)/route":
      return {
        title: "Route Help",
        description: "This is help content for the Route tab.",
      };
    case "/(tabs)/calendar":
      return {
        title: "Calendar Help",
        description: "Here's how to use your calendar.",
      };
    case "/(tabs)/statistics":
      return {
        title: "Statistics Help",
        description: "View your health stats and progress here.",
      };
    default:
      return undefined; // No help content for this route
  }
}

export default function RootLayout() {
  const helpContent = useHelpContent();
  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <PersistGate loading={<LoadingScreen />} persistor={persistor}>
                <LanguageProvider>
                  <View style={{ flex: 1 }}>
                    <LanguageToolbar helpContent={helpContent} />
                    <AppContent />
                  </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
  },
});
