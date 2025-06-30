
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authSlice';
import mealReducer from './mealSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const mealPersistConfig = {
  key: 'meal',
  storage: AsyncStorage,
  whitelist: ['meals'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedMealReducer = persistReducer(mealPersistConfig, mealReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meal: persistedMealReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
