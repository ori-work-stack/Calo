import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import authSlice from "./authSlice";
import mealSlice from "./mealSlice";
import calendarSlice from "./calendarSlice";
import questionnaireSlice from "./questionnaireSlice";

// Cross-platform storage adapter for redux-persist
const createCrossPlatformStorage = () => {
  if (Platform.OS === "web") {
    return {
      setItem: async (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      getItem: async (key: string) => {
        return localStorage.getItem(key);
      },
      removeItem: async (key: string) => {
        localStorage.removeItem(key);
      },
    };
  } else {
    // For mobile, sanitize keys because SecureStore doesn't allow all chars
    const sanitizeKey = (key: string): string =>
      key.replace(/[^a-zA-Z0-9._-]/g, "_");

    return {
      setItem: async (key: string, value: string) => {
        const sanitizedKey = sanitizeKey(key);
        await SecureStore.setItemAsync(sanitizedKey, value);
      },
      getItem: async (key: string) => {
        const sanitizedKey = sanitizeKey(key);
        return await SecureStore.getItemAsync(sanitizedKey);
      },
      removeItem: async (key: string) => {
        const sanitizedKey = sanitizeKey(key);
        await SecureStore.deleteItemAsync(sanitizedKey);
      },
    };
  }
};

const crossPlatformStorage = createCrossPlatformStorage();

// Auth config uses cross-platform storage (SecureStore on mobile, localStorage on web)
const authPersistConfig = {
  key: "auth",
  storage: crossPlatformStorage,
  whitelist: ["user", "token", "isAuthenticated"],
};

// Meal and Calendar configs use AsyncStorage (no sensitive data)
const mealPersistConfig = {
  key: "meal",
  storage: AsyncStorage,
  whitelist: ["meals"],
};

const calendarPersistConfig = {
  key: "calendar",
  storage: AsyncStorage,
  whitelist: ["calendarData"],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authSlice);
const persistedMealReducer = persistReducer(mealPersistConfig, mealSlice);
const persistedCalendarReducer = persistReducer(
  calendarPersistConfig,
  calendarSlice
);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meal: persistedMealReducer,
    calendar: persistedCalendarReducer,
    questionnaire: questionnaireSlice,
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
