import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/src/store";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppInitialization } from "@/hooks/useAppInitialization";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  useAppInitialization();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
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
