import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

interface SwipeNavigationWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SwipeNavigationWrapper({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}: SwipeNavigationWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  const isNavigating = useSharedValue(false);

  // Define the tab order
  const tabOrder = [
    "index",
    "history",
    "camera",
    "statistics",
    "calendar",
    "devices",
    "questionnaire",
    "recommended-menus",
    "ai-chat",
    "food-scanner",
    "profile",
  ];

  const getCurrentTabIndex = () => {
    // Handle both /(tabs)/ and direct paths
    const pathSegments = pathname.split("/");
    let currentTab = pathSegments[pathSegments.length - 1];

    // Handle root index case
    if (currentTab === "(tabs)" || currentTab === "") {
      currentTab = "index";
    }

    const index = tabOrder.indexOf(currentTab);
    return index === -1 ? 0 : index;
  };

  const navigateToTab = (tabName: string) => {
    if (tabName === "index") {
      router.push("/(tabs)/");
    } else {
      router.push(`/(tabs)/${tabName}`);
    }
  };

  const defaultSwipeLeft = () => {
    const currentIndex = getCurrentTabIndex();
    const nextIndex = currentIndex + 1;
    if (nextIndex < tabOrder.length) {
      const nextTab = tabOrder[nextIndex];
      navigateToTab(nextTab);
    }
  };

  const defaultSwipeRight = () => {
    const currentIndex = getCurrentTabIndex();
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevTab = tabOrder[prevIndex];
      navigateToTab(prevTab);
    }
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {
      startX: number;
      isHorizontal: boolean;
      canSwipeLeft: boolean;
      canSwipeRight: boolean;
    }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.isHorizontal = false;

      // Check if we can swipe in each direction
      const currentIndex = runOnJS(getCurrentTabIndex)();
      context.canSwipeLeft = currentIndex < tabOrder.length - 1;
      context.canSwipeRight = currentIndex > 0;
    },
    onActive: (event, context) => {
      if (isNavigating.value) return;

      const deltaX = Math.abs(event.translationX);
      const deltaY = Math.abs(event.translationY);

      // More sensitive horizontal detection
      if (deltaX > deltaY && deltaX > 15) {
        context.isHorizontal = true;

        // Smooth visual feedback with resistance at boundaries
        let translation = event.translationX;

        // Add resistance when swiping beyond available tabs
        if (translation < 0 && !context.canSwipeLeft) {
          translation = translation * 0.3; // Resistance for left swipe when no next tab
        } else if (translation > 0 && !context.canSwipeRight) {
          translation = translation * 0.3; // Resistance for right swipe when no prev tab
        }

        // Smooth translation with diminishing returns
        translateX.value = interpolate(
          Math.abs(translation),
          [0, SCREEN_WIDTH * 0.3],
          [0, translation * 0.4],
          Extrapolate.CLAMP
        );
      }
    },
    onEnd: (event, context) => {
      if (isNavigating.value) return;

      if (context.isHorizontal) {
        const shouldSwipeLeft =
          event.translationX < -threshold &&
          event.velocityX < -500 &&
          context.canSwipeLeft;
        const shouldSwipeRight =
          event.translationX > threshold &&
          event.velocityX > 500 &&
          context.canSwipeRight;

        if (shouldSwipeLeft) {
          isNavigating.value = true;
          // Animate out to the left
          translateX.value = withTiming(
            -SCREEN_WIDTH * 0.3,
            {
              duration: 200,
            },
            () => {
              runOnJS(onSwipeLeft || defaultSwipeLeft)();
              // Reset after navigation
              translateX.value = withTiming(0, { duration: 100 }, () => {
                isNavigating.value = false;
              });
            }
          );
        } else if (shouldSwipeRight) {
          isNavigating.value = true;
          // Animate out to the right
          translateX.value = withTiming(
            SCREEN_WIDTH * 0.3,
            {
              duration: 200,
            },
            () => {
              runOnJS(onSwipeRight || defaultSwipeRight)();
              // Reset after navigation
              translateX.value = withTiming(0, { duration: 100 }, () => {
                isNavigating.value = false;
              });
            }
          );
        } else {
          // Spring back to center
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
        }
      } else {
        // Not a horizontal swipe, spring back
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH * 0.2],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH * 0.2],
      [1, 0.98],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX: translateX.value }, { scale: scale }],
      opacity: opacity,
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-15, 15]}
      failOffsetY={[-25, 25]}
      shouldCancelWhenOutside={true}
      enableTrackpadTwoFingerGesture={false}
    >
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
