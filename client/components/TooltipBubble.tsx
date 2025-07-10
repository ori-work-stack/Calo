import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TooltipBubbleProps {
  message: string;
  pageKey: string;
  position?: "top" | "bottom" | "center";
  persistent?: boolean;
  showDelay?: number;
}

export const TooltipBubble: React.FC<TooltipBubbleProps> = ({
  message,
  pageKey,
  position = "top",
  persistent = false,
  showDelay = 1000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const checkDismissalStatus = async () => {
      if (!persistent) {
        try {
          const dismissed = await AsyncStorage.getItem(
            `tooltip_dismissed_${pageKey}`
          );
          if (dismissed === "true") {
            setIsDismissed(true);
            return;
          }
        } catch (error) {
          console.log("Error checking tooltip dismissal:", error);
        }
      }

      // Show tooltip after delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, showDelay);

      return () => clearTimeout(timer);
    };

    checkDismissalStatus();
  }, [pageKey, persistent, showDelay]);

  const handleDismiss = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });

    if (!persistent) {
      try {
        await AsyncStorage.setItem(`tooltip_dismissed_${pageKey}`, "true");
      } catch (error) {
        console.log("Error saving tooltip dismissal:", error);
      }
    }
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  const getPositionStyle = () => {
    switch (position) {
      case "top":
        return { top: 50 };
      case "bottom":
        return { bottom: 50 };
      case "center":
        return { top: "50%", marginTop: -25 };
      default:
        return { top: 50 };
    }
  };

  return (
    <Animated.View
      style={[styles.container, getPositionStyle(), { opacity: fadeAnim }]}
    >
      <View style={styles.tooltip}>
        <Text style={styles.text}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  tooltip: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  closeButton: {
    marginLeft: 10,
    padding: 5,
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
