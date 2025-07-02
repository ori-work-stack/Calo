import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authReducer from "./authSlice";
import mealReducer from "./mealSlice";
import calendarReducer from "./calendarSlice";

const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["user", "token", "isAuthenticated"],
};

const mealPersistConfig = {
  key: "meal",
  storage: AsyncStorage,
  whitelist: ["meals"],
};

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
