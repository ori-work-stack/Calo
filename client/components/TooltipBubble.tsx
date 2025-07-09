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
  text: string;
  onHide: () => void;
  duration?: number;
  style?: ViewStyle;
}

export const TooltipBubble: React.FC<TooltipBubbleProps> = ({
  text,
  onHide,
  duration = 3000,
  style = {},
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

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
          maxWidth: width * 0.8,
        },
      ]}
    >
      <Text style={styles.text}>{text}</Text>
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
