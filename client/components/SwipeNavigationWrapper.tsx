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
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export default function SwipeNavigationWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: SwipeNavigationWrapperProps) {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const defaultSwipeRight = () => {
    router.push("/(tabs)/camera");
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldSwipeLeft =
        event.translationX < -threshold && event.velocityX < 0;
      const shouldSwipeRight =
        event.translationX > threshold && event.velocityX > 0;

      if (shouldSwipeLeft && onSwipeLeft) {
        runOnJS(onSwipeLeft)();
      } else if (shouldSwipeRight) {
        runOnJS(onSwipeRight || defaultSwipeRight)();
      }

      translateX.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
