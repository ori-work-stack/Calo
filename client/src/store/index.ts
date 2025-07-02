import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import authReducer from "./authSlice";
import mealReducer from "./mealSlice";
import calendarReducer from "./calendarSlice";

// Create secure storage adapter for redux-persist
const createSecureStorage = () => {
  // Helper function to sanitize keys for SecureStore
  const sanitizeKey = (key: string): string => {
    return key.replace(/[^a-zA-Z0-9._-]/g, "_");
  };

  return {
    setItem: async (key: string, value: string) => {
      const sanitizedKey = sanitizeKey(key);
      await SecureStore.setItemAsync(sanitizedKey, value);
    },
    getItem: async (key: string) => {
      const sanitizedKey = sanitizeKey(key);
      const result = await SecureStore.getItemAsync(sanitizedKey);
      return result;
    },
    removeItem: async (key: string) => {
      const sanitizedKey = sanitizeKey(key);
      await SecureStore.deleteItemAsync(sanitizedKey);
    },
  };
};

const secureStorage = createSecureStorage();

// Auth config using SecureStore for sensitive data
const authPersistConfig = {
  key: "auth",
  storage: secureStorage,
  whitelist: ["user", "token", "isAuthenticated"],
};

// Meal config using regular AsyncStorage (not sensitive data)
const mealPersistConfig = {
  key: "meal",
  storage: AsyncStorage,
  whitelist: ["meals"],
};

// Calendar config using regular AsyncStorage (not sensitive data)
const calendarPersistConfig = {
  key: "calendar",
  storage: AsyncStorage,
  whitelist: ["calendarData"], // Only persist calendar data, not loading states
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedMealReducer = persistReducer(mealPersistConfig, mealReducer);
const persistedCalendarReducer = persistReducer(
  calendarPersistConfig,
  calendarReducer
);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meal: persistedMealReducer,
    calendar: persistedCalendarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
