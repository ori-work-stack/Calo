// components/TooltipBubble.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  StyleSheet,
  View,
  I18nManager,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

interface TooltipBubbleProps {
  text?: string;
  onHide: () => void;
  duration?: number;
  style?: ViewStyle;
  currentRoute?: string;
}

const getTooltipText = (route: string): string => {
  switch (route) {
    case "/(tabs)/index":
      return "Welcome! This is your dashboard where you can see your daily nutrition overview and quick stats.";
    case "/(tabs)/meals":
      return "View and manage all your logged meals. Tap on any meal to see detailed nutrition information.";
    case "/(tabs)/camera":
      return "Take photos of your food to automatically analyze nutrition content using AI.";
    case "/(tabs)/statistics":
      return "Track your nutrition progress with detailed charts and statistics over time.";
    case "/(tabs)/calendar":
      return "View your meal history by date and plan your future meals.";
    case "/(tabs)/history":
      return "Browse your complete meal history, rate meals, and save favorites.";
    case "/(tabs)/food-scanner":
      return "Scan barcodes or search for packaged foods to get instant nutrition information.";
    case "/(tabs)/ai-chat":
      return "Chat with our AI nutritionist for personalized advice and answers to your questions.";
    case "/(tabs)/profile":
      return "Manage your account settings, preferences, and view your nutrition goals.";
    case "/(tabs)/devices":
      return "Connect fitness trackers and health devices to sync your activity data.";
    default:
      return "Swipe left or right to navigate between tabs, or use the tab bar below.";
  }
};

export const TooltipBubble: React.FC<TooltipBubbleProps> = ({
  text,
  onHide,
  duration = 5000,
  style = {},
  currentRoute = "",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  const displayText = text || getTooltipText(currentRoute);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        style,
        {
          opacity: fadeAnim,
          alignSelf: I18nManager.isRTL ? "flex-end" : "flex-start",
          maxWidth: width * 0.9,
        },
      ]}
    >
      <Text style={styles.text}>{displayText}</Text>
      <View
        style={[
          styles.arrow,
          I18nManager.isRTL ? styles.arrowRTL : styles.arrowLTR,
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 10,
    position: "absolute",
    top: -70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  arrow: {
    position: "absolute",
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#222",
  },
  arrowLTR: {
    left: 16,
  },
  arrowRTL: {
    right: 16,
  },
});
