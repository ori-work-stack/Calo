import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { I18nManager, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
  currentLanguage: string;
  language: string;
  setLanguage: (language: string) => void;
  changeLanguage: (language: string) => Promise<void>;
  isRTL: boolean;
  isLoading: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isRTL, setIsRTL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateRTL = useCallback((language: string) => {
    const rtl = language === "he";
    setIsRTL(rtl);

    if (Platform.OS !== "web") {
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        // Note: App reload might be needed to reflect RTL changes.
      }
    } else {
      document.documentElement.dir = rtl ? "rtl" : "ltr";
      document.documentElement.lang = language;
      document.body.style.direction = rtl ? "rtl" : "ltr";
    }
  }, []);

  const changeLanguage = useCallback(
    async (language: string) => {
      if (language === currentLanguage) return;
      setIsLoading(true);
      try {
        await i18n.changeLanguage(language);
        await AsyncStorage.setItem("userLanguage", language);
        setCurrentLanguage(language);
        updateRTL(language);
      } catch (err) {
        console.error("Error changing language:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, i18n, updateRTL]
  );

  const setLanguage = useCallback(
    (lang: string) => {
      void changeLanguage(lang);
    },
    [changeLanguage]
  );

  const loadSavedLanguage = useCallback(async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      const languageToUse = savedLanguage || "en";
      await i18n.changeLanguage(languageToUse);
      setCurrentLanguage(languageToUse);
      updateRTL(languageToUse);
    } catch (err) {
      console.error("Error loading language:", err);
    } finally {
      setIsLoading(false);
    }
  }, [i18n, updateRTL]);

  useEffect(() => {
    void loadSavedLanguage();
  }, [loadSavedLanguage]);

  const value = useMemo(
    () => ({
      currentLanguage,
      language: currentLanguage,
      setLanguage,
      changeLanguage,
      isRTL,
      isLoading,
      t,
    }),
    [currentLanguage, setLanguage, changeLanguage, isRTL, isLoading, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
