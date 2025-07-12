import { Alert } from "react-native";

export interface ErrorDetails {
  title?: string;
  message: string;
  code?: string;
  action?: () => void;
  actionText?: string;
}

export class ErrorHandler {
  static showError(error: ErrorDetails) {
    const buttons = [
      {
        text: "OK",
        onPress: error.action || (() => {}),
      },
    ];

    if (error.actionText && error.action) {
      buttons.unshift({
        text: "Cancel",
        style: "cancel" as const,
        onPress: () => {},
      });
      buttons[1].text = error.actionText;
    }

    Alert.alert(error.title || "שגיאה", error.message, buttons);
  }

  static showSuccess(message: string, action?: () => void) {
    Alert.alert("הצלחה!", message, [
      {
        text: "OK",
        onPress: action || (() => {}),
      },
    ]);
  }

  static showWarning(message: string, onConfirm?: () => void) {
    Alert.alert("אזהרה", message, [
      {
        text: "ביטול",
        style: "cancel",
      },
      {
        text: "המשך",
        onPress: onConfirm || (() => {}),
      },
    ]);
  }

  static handleApiError(error: any): ErrorDetails {
    if (error?.response?.data?.error) {
      return {
        message: error.response.data.error,
        code: error.response.status?.toString(),
      };
    }

    if (error?.message) {
      return {
        message: error.message,
      };
    }

    return {
      message: "אירעה שגיאה לא צפויה. אנא נסה שוב.",
    };
  }

  static validateForm(
    fields: { [key: string]: any },
    rules: { [key: string]: (value: any) => string | null }
  ): string[] {
    const errors: string[] = [];

    Object.keys(rules).forEach((fieldName) => {
      const value = fields[fieldName];
      const error = rules[fieldName](value);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }
}

export const ValidationRules = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${fieldName} הוא שדה חובה`;
    }
    return null;
  },

  minLength: (fieldName: string, min: number) => (value: string) => {
    if (value && value.length < min) {
      return `${fieldName} חייב להכיל לפחות ${min} תווים`;
    }
    return null;
  },

  numeric: (fieldName: string, min?: number, max?: number) => (value: any) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) {
      return `${fieldName} חייב להיות מספר`;
    }
    if (min !== undefined && num < min) {
      return `${fieldName} חייב להיות לפחות ${min}`;
    }
    if (max !== undefined && num > max) {
      return `${fieldName} חייב להיות לכל היותר ${max}`;
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return "כתובת אימייל לא תקינה";
    }
    return null;
  },
};
