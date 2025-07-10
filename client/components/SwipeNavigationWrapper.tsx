import React from "react";
import { View, StyleSheet } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

interface SwipeNavigationWrapperProps {
  children: React.ReactNode;
  currentRoute: string;
}

const TAB_ROUTES = [
  "/(tabs)/index",
  "/(tabs)/meal-plans",
  "/(tabs)/meals",
  "/(tabs)/camera",
  "/(tabs)/statistics",
  "/(tabs)/calendar",
  "/(tabs)/devices",
  "/(tabs)/history",
  "/(tabs)/recommended-menus",
  "/(tabs)/ai-chat",
  "/(tabs)/food-scanner",
  "/(tabs)/profile",
];

export const SwipeNavigationWrapper: React.FC<SwipeNavigationWrapperProps> = ({
  children,
  currentRoute,
}) => {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const currentIndex = TAB_ROUTES.indexOf(currentRoute);

  const navigateToRoute = (direction: "left" | "right") => {
    let newIndex = currentIndex;

    if (direction === "right" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "left" && currentIndex < TAB_ROUTES.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      router.push(TAB_ROUTES[newIndex] as any);
    }
  };

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        // Optional: Add haptic feedback or visual indication
      },
      onActive: (event) => {
        translateX.value = event.translationX;
        // Add slight opacity change for visual feedback
        opacity.value = 1 - Math.abs(event.translationX) / 1000;
      },
      onEnd: (event) => {
        const { translationX, velocityX } = event;
        const threshold = 100;
        const velocityThreshold = 500;

        // Determine swipe direction and trigger navigation
        if (
          (translationX > threshold || velocityX > velocityThreshold) &&
          currentIndex > 0
        ) {
          runOnJS(navigateToRoute)("right");
        } else if (
          (translationX < -threshold || velocityX < -velocityThreshold) &&
          currentIndex < TAB_ROUTES.length - 1
        ) {
          runOnJS(navigateToRoute)("left");
        }

        // Reset animation values
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      },
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value * 0.1 }], // Subtle movement
      opacity: opacity.value,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
