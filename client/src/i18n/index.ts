import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
    
// Translation files
import en from "./locales/en.json";
import he from "./locales/he.json";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem("@userLanguage");
      callback(savedLanguage || "en");
    } catch (error) {
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem("@userLanguage", lng);
    } catch (error) {
      console.log("Error saving language", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    fallbackLng: "en",
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
