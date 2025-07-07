import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Vibration,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import AIChatScreen from "../app/(tabs)/ai-chat";

// Define the props interface for AIChatScreen
interface AIChatScreenProps {
  onClose?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BUTTON_SIZE = 56;
const EDGE_MARGIN = 20;

export default function FloatingChatButton() {
  const [showChat, setShowChat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });

  // Pulse animation for attention
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX, translationY } = event.nativeEvent;

    if (state === State.BEGAN) {
      // Scale down when touch starts
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();

      // Light haptic feedback
      if (Platform.OS === "ios") {
        Vibration.vibrate(10);
      }
    }

    if (state === State.ACTIVE) {
      // Update current position during drag
      setCurrentPosition({
        x: currentPosition.x + translationX,
        y: currentPosition.y + translationY,
      });
    }

    if (state === State.END) {
      // Scale back to normal
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Snap to edges logic
      const finalX = currentPosition.x + translationX;
      const finalY = currentPosition.y + translationY;

      // Calculate snap position
      const snapToLeft = finalX < screenWidth / 2;
      const snapX = snapToLeft
        ? -screenWidth / 2 + EDGE_MARGIN
        : screenWidth / 2 - EDGE_MARGIN;

      // Constrain Y position
      const maxY = screenHeight / 2 - BUTTON_SIZE - 100;
      const minY = -screenHeight / 2 + BUTTON_SIZE + 100;
      const snapY = Math.max(minY, Math.min(maxY, finalY));

      // Animate to snap position
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: snapX,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: snapY,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Update stored position
      setCurrentPosition({ x: snapX, y: snapY });

      // Reset gesture values
      translateX.setOffset(snapX);
      translateY.setOffset(snapY);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const handlePress = () => {
    // Rotation animation on press
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    if (Platform.OS === "ios") {
      Vibration.vibrate(50);
    }

    setShowChat(true);
  };

  const handleClose = () => {
    setShowChat(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setShowChat(false);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateX },
                { translateY },
                { scale: scaleAnim },
                { scale: pulseAnim },
                { rotate: rotation },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, isMinimized && styles.minimizedButton]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={isMinimized ? 20 : 24}
              color="#fff"
            />
            {/* Notification dot */}
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={handleMinimize}
              style={styles.headerButton}
            >
              <Ionicons name="remove" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#007AFF" />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Chat Content */}
          <View style={styles.chatContent}>
            <AIChatScreen />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    // Modern gradient effect
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  minimizedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.8,
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
    ...Platform.select({
      ios: {
        paddingTop: 50, // Account for status bar
      },
      android: {
        paddingTop: 20,
      },
    }),
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  headerTitle: {
    padding: 8,
  },
  chatContent: {
    flex: 1,
  },
});
