import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

interface LanguageContextType {
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(false);

  const updateRTL = (language: string) => {
    const rtl = language === "he";
    setIsRTL(rtl);

    if (Platform.OS !== "web") {
      // For React Native
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
    } else {
      // For web
      document.documentElement.dir = rtl ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      setIsLoading(true);
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem("@userLanguage", language);
      setCurrentLanguage(language);
      updateRTL(language);
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("@userLanguage");
      const languageToUse = savedLanguage || "en";

      if (i18n.language !== languageToUse) {
        await i18n.changeLanguage(languageToUse);
      }

      setCurrentLanguage(languageToUse);
      updateRTL(languageToUse);
    } catch (error) {
      console.error("Error loading saved language:", error);
      setCurrentLanguage("en");
      updateRTL("en");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
