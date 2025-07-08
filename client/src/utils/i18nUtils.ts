import { useLanguage } from "@/src/i18n/context/LanguageContext";

// Utility function to get localized content from database objects
export const getLocalizedContent = (
  content: { [key: string]: any },
  field: string,
  currentLanguage: string = "en"
): string => {
  // Try to get content in current language
  const localizedField = `${field}_${currentLanguage}`;
  if (content[localizedField]) {
    return content[localizedField];
  }

  // Fallback to English
  const englishField = `${field}_en`;
  if (content[englishField]) {
    return content[englishField];
  }

  // Fallback to the base field
  if (content[field]) {
    return content[field];
  }

  return "";
};

// Hook to use localized content
export const useLocalizedContent = () => {
  const { currentLanguage } = useLanguage();

  return (content: { [key: string]: any }, field: string): string => {
    return getLocalizedContent(content, field, currentLanguage);
  };
};

// Utility function to format numbers based on language
export const formatNumber = (
  number: number,
  language: string = "en"
): string => {
  if (language === "he") {
    return new Intl.NumberFormat("he-IL").format(number);
  }
  return new Intl.NumberFormat("en-US").format(number);
};

// Utility function to format dates based on language
export const formatDate = (
  date: Date | string,
  language: string = "en"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (language === "he") {
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
};
