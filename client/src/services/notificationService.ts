import { Alert, ToastAndroid, Platform } from "react-native";

export enum NotificationType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface NotificationConfig {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: {
    text: string;
    onPress: () => void;
  };
}

export class NotificationService {
  static show(config: NotificationConfig) {
    if (Platform.OS === "android") {
      // Use Android Toast for simple notifications
      ToastAndroid.show(config.message, ToastAndroid.LONG);
    } else {
      // Use Alert for iOS and complex notifications
      const buttons = [
        {
          text: "OK",
          onPress: config.action?.onPress || (() => {}),
        },
      ];

      if (config.action) {
        buttons.unshift({
          text: "ביטול",
          style: "cancel" as const,
          onPress: () => {},
        });
        buttons[1].text = config.action.text;
      }

      Alert.alert(
        config.title || this.getDefaultTitle(config.type),
        config.message,
        buttons
      );
    }
  }

  static success(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.SUCCESS,
      title: title || "הצלחה!",
      message,
      action,
    });
  }

  static error(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.ERROR,
      title: title || "שגיאה",
      message,
      action,
    });
  }

  static warning(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.WARNING,
      title: title || "אזהרה",
      message,
      action,
    });
  }

  static info(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.INFO,
      title: title || "מידע",
      message,
      action,
    });
  }

  private static getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return "הצלחה!";
      case NotificationType.ERROR:
        return "שגיאה";
      case NotificationType.WARNING:
        return "אזהרה";
      case NotificationType.INFO:
        return "מידע";
      default:
        return "";
    }
  }
}
