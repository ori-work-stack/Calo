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
  position: "top" | "bottom" | "left" | "right";
  isVisible: boolean;
  onClose: () => void;
  targetRef?: React.RefObject<any>;
  storageKey?: string;
}

export default function TooltipBubble({
  message,
  position = "top",
  isVisible,
  onClose,
  storageKey,
}: TooltipBubbleProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0));
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    checkStorageAndShow();
  }, []);

  useEffect(() => {
    if (isVisible && shouldShow) {
      showTooltip();
    } else {
      hideTooltip();
    }
  }, [isVisible, shouldShow]);

  const checkStorageAndShow = async () => {
    if (storageKey) {
      try {
        const hasShown = await AsyncStorage.getItem(storageKey);
        if (!hasShown) {
          setShouldShow(true);
        }
      } catch (error) {
        console.error("Error checking tooltip storage:", error);
        setShouldShow(true);
      }
    } else {
      setShouldShow(true);
    }
  };

  const showTooltip = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideTooltip = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClose = async () => {
    if (storageKey) {
      try {
        await AsyncStorage.setItem(storageKey, "true");
      } catch (error) {
        console.error("Error saving tooltip state:", error);
      }
    }
    onClose();
  };

  if (!isVisible || !shouldShow) {
    return null;
  }

  const getArrowStyle = () => {
    switch (position) {
      case "top":
        return styles.arrowBottom;
      case "bottom":
        return styles.arrowTop;
      case "left":
        return styles.arrowRight;
      case "right":
        return styles.arrowLeft;
      default:
        return styles.arrowBottom;
    }
  };

  return (
    <Animated.View
      style={[
        styles.tooltip,
        styles[position],
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.arrow, getArrowStyle()]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    zIndex: 1000,
    maxWidth: 250,
  },
  top: {
    bottom: "100%",
    marginBottom: 8,
  },
  bottom: {
    top: "100%",
    marginTop: 8,
  },
  left: {
    right: "100%",
    marginRight: 8,
  },
  right: {
    left: "100%",
    marginLeft: 8,
  },
  bubble: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    color: "white",
    fontSize: 14,
    flex: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  arrowTop: {
    top: -6,
    left: "50%",
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#333",
  },
  arrowBottom: {
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#333",
  },
  arrowLeft: {
    left: -6,
    top: "50%",
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#333",
  },
  arrowRight: {
    right: -6,
    top: "50%",
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#333",
  },
});
