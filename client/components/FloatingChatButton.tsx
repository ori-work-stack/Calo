import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
  Text,
  SafeAreaView,
  PanResponder,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AIChatScreen from "../app/(tabs)/ai-chat";

// Enhanced interface with better typing
interface AIChatScreenProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

interface Position {
  x: number;
  y: number;
}

// Enhanced constants with better responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BUTTON_SIZE = 64;
const MINIMIZED_SIZE = 48;
const EDGE_MARGIN = 16;
const SAFE_AREA_MARGIN = 100;

// Animation configurations
const ANIMATIONS = {
  spring: {
    tension: 120,
    friction: 8,
    useNativeDriver: true,
  },
  timing: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    useNativeDriver: true,
  },
  quickTiming: {
    duration: 150,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  },
} as const;

// Enhanced color scheme
const COLORS = {
  primary: "#007AFF",
  primaryDark: "#0056CC",
  secondary: "#34C759",
  danger: "#FF3B30",
  background: "#F2F2F7",
  surface: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  border: "#C6C6C8",
  shadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export default function FloatingChatButton() {
  // State management
  const [showChat, setShowChat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [position, setPosition] = useState<Position>({
    x: screenWidth / 2 - EDGE_MARGIN - BUTTON_SIZE / 2,
    y: 0,
  });

  // Animation refs
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Initialize position on mount
  useEffect(() => {
    // Set initial position to right edge
    const initialX = screenWidth / 2 - EDGE_MARGIN - BUTTON_SIZE / 2;
    const initialY = 0;

    setPosition({ x: initialX, y: initialY });
    translateX.setOffset(initialX);
    translateY.setOffset(initialY);
  }, [translateX, translateY]);

  // Enhanced pulse animation with better timing
  useEffect(() => {
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    let pulseAnimation: Animated.CompositeAnimation;

    if (!isDragging && !showChat) {
      pulseAnimation = createPulseAnimation();
      pulseAnimation.start();
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isDragging, showChat, pulseAnim]);

  // Glow animation for online status
  useEffect(() => {
    if (isOnline) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
  }, [isOnline, glowAnim]);

  // Enhanced pan responder with proper gesture handling
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);

        // Stop current offset and get current values
        translateX.setOffset(position.x);
        translateY.setOffset(position.y);
        translateX.setValue(0);
        translateY.setValue(0);

        // Enhanced haptic feedback
        if (Platform.OS === "ios") {
          Vibration.vibrate([10]);
        }

        // Scale and opacity animations
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            ...ANIMATIONS.spring,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.9,
            ...ANIMATIONS.quickTiming,
          }),
        ]).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);

        // Calculate final position based on current offset + gesture
        const finalX = position.x + gestureState.dx;
        const finalY = position.y + gestureState.dy;

        // Enhanced snap logic - snap to nearest edge
        const snapToLeft = finalX < 0;
        const snapX = snapToLeft
          ? -screenWidth / 2 + EDGE_MARGIN + BUTTON_SIZE / 2
          : screenWidth / 2 - EDGE_MARGIN - BUTTON_SIZE / 2;

        // Constrain Y position with safe areas
        const maxY = screenHeight / 2 - BUTTON_SIZE - SAFE_AREA_MARGIN;
        const minY = -screenHeight / 2 + BUTTON_SIZE + SAFE_AREA_MARGIN;
        const snapY = Math.max(minY, Math.min(maxY, finalY));

        // Update position state
        setPosition({ x: snapX, y: snapY });

        // Animate to snap position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: snapX,
            ...ANIMATIONS.spring,
          }),
          Animated.spring(translateY, {
            toValue: snapY,
            ...ANIMATIONS.spring,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            ...ANIMATIONS.spring,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            ...ANIMATIONS.timing,
          }),
        ]).start(() => {
          // Reset offset after animation completes
          translateX.setOffset(snapX);
          translateY.setOffset(snapY);
          translateX.setValue(0);
          translateY.setValue(0);
        });
      },
    });
  }, [position, scaleAnim, opacityAnim, translateX, translateY]);

  // Enhanced press handler with better animations
  const handlePress = useCallback(() => {
    if (isDragging) return;

    // Enhanced rotation and scale animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          ...ANIMATIONS.spring,
        }),
      ]),
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...ANIMATIONS.spring,
        }),
      ]),
    ]).start();

    // Enhanced haptic feedback
    if (Platform.OS === "ios") {
      Vibration.vibrate([50, 20, 50]);
    }

    setShowChat(true);
    setUnreadCount(0); // Clear unread count when opening chat
  }, [isDragging, rotateAnim, scaleAnim]);

  const handleClose = useCallback(() => {
    setShowChat(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setShowChat(false);
  }, []);

  // Computed styles
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const buttonSize = isMinimized ? MINIMIZED_SIZE : BUTTON_SIZE;

  return (
    <>
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
            opacity: opacityAnim,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: isOnline ? COLORS.primary : COLORS.textSecondary,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {/* Glow effect for online status */}
          {isOnline && (
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: glowOpacity,
                  width: buttonSize + 8,
                  height: buttonSize + 8,
                  borderRadius: (buttonSize + 8) / 2,
                },
              ]}
            />
          )}

          <Ionicons
            name="chatbubble-ellipses"
            size={isMinimized ? 20 : 28}
            color={COLORS.surface}
          />

          {/* Enhanced notification badge */}
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {unreadCount > 99 ? "99+" : unreadCount.toString()}
              </Text>
            </View>
          )}

          {/* Online status indicator */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isOnline
                  ? COLORS.secondary
                  : COLORS.textSecondary,
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
        statusBarTranslucent={Platform.OS === "android"}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.surface}
            translucent={Platform.OS === "android"}
          />

          {/* Enhanced chat header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={handleMinimize}
              style={styles.headerButton}
            >
              <Ionicons name="remove" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <View style={styles.headerTitleContent}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.headerTitleText}>AI Assistant</Text>
                <View
                  style={[
                    styles.headerStatusDot,
                    {
                      backgroundColor: isOnline
                        ? COLORS.secondary
                        : COLORS.textSecondary,
                    },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Chat content */}
          <View style={styles.chatContent}>
            <AIChatScreen onClose={handleClose} onMinimize={handleMinimize} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    right: 20,
    zIndex: 1000,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  glowEffect: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    zIndex: -1,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
    paddingHorizontal: 6,
  },
  notificationText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    minWidth: 44,
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chatContent: {
    flex: 1,
  },
});
