import React, { useCallback, useMemo } from "react";
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
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";

interface SwipeNavigationWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

  const tabOrder = useMemo(
    () => [
      "index",
      "history",
      "camera",
      "statistics",
      "calendar",
      "devices",
      "recommended-menus",
      "ai-chat",
      "food-scanner",
      "profile",
    ],
    []
  );

  const getCurrentTabIndex = useCallback(() => {
    const pathSegments = pathname.split("/");
    let currentTab = pathSegments[pathSegments.length - 1];

    if (currentTab === "(tabs)" || currentTab === "") {
      currentTab = "index";
    }

    const index = tabOrder.indexOf(currentTab);
    return index === -1 ? 0 : index;
  }, [pathname, tabOrder]);

  const navigateToTab = useCallback(
    (tabName: string) => {
      if (tabName === "index") {
        router.push("/(tabs)/");
      } else {
        router.push(`/(tabs)/${tabName}`);
      }
    },
    [router]
  );

  const defaultSwipeLeft = useCallback(() => {
    const currentIndex = getCurrentTabIndex();
    const nextIndex = currentIndex + 1;
    if (nextIndex < tabOrder.length) {
      const nextTab = tabOrder[nextIndex];
      navigateToTab(nextTab);
    }
  }, [getCurrentTabIndex, tabOrder, navigateToTab]);

  const defaultSwipeRight = useCallback(() => {
    const currentIndex = getCurrentTabIndex();
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prevTab = tabOrder[prevIndex];
      navigateToTab(prevTab);
    }
  }, [getCurrentTabIndex, tabOrder, navigateToTab]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {
      startX: number;
      startY: number;
      isValidGesture: boolean;
      canSwipeLeft: boolean;
      canSwipeRight: boolean;
    }
  >({
    onStart: (event, context) => {
      if (isNavigating.value) return;

      const currentIndex = runOnJS(getCurrentTabIndex)();
      context.canSwipeLeft = currentIndex < tabOrder.length - 1;
      context.canSwipeRight = currentIndex > 0;
      context.startX = event.absoluteX;
      context.startY = event.absoluteY;
      context.isValidGesture = false;

      // Block gesture if in tab bar area (bottom 150px to be safe)
      if (event.absoluteY > SCREEN_HEIGHT - 150) {
        return;
      }
    },
    onActive: (event, context) => {
      if (isNavigating.value) return;

      // Block if in tab bar area
      if (
        event.absoluteY > SCREEN_HEIGHT - 150 ||
        context.startY > SCREEN_HEIGHT - 150
      ) {
        return;
      }

      const deltaX = Math.abs(event.translationX);
      const deltaY = Math.abs(event.translationY);

      // Only allow clearly horizontal swipes
      if (deltaX > 20 && deltaX > deltaY * 2.5) {
        context.isValidGesture = true;

        let translation = event.translationX;

        // Add resistance at boundaries
        if (translation < 0 && !context.canSwipeLeft) {
          translation = translation * 0.1;
        } else if (translation > 0 && !context.canSwipeRight) {
          translation = translation * 0.1;
        }

        translateX.value = translation * 0.3;
      }
    },
    onEnd: (event, context) => {
      if (isNavigating.value || !context.isValidGesture) {
        translateX.value = withSpring(0);
        return;
      }

      // Block if in tab bar area
      if (
        event.absoluteY > SCREEN_HEIGHT - 150 ||
        context.startY > SCREEN_HEIGHT - 150
      ) {
        translateX.value = withSpring(0);
        return;
      }

      const shouldSwipeLeft =
        event.translationX < -threshold &&
        Math.abs(event.velocityX) > 300 &&
        event.velocityX < 0 &&
        context.canSwipeLeft;

      const shouldSwipeRight =
        event.translationX > threshold &&
        Math.abs(event.velocityX) > 300 &&
        event.velocityX > 0 &&
        context.canSwipeRight;

      if (shouldSwipeLeft) {
        isNavigating.value = true;
        translateX.value = withTiming(
          -SCREEN_WIDTH * 0.2,
          { duration: 150 },
          () => {
            runOnJS(onSwipeLeft || defaultSwipeLeft)();
            translateX.value = withTiming(0, { duration: 100 }, () => {
              isNavigating.value = false;
            });
          }
        );
      } else if (shouldSwipeRight) {
        isNavigating.value = true;
        translateX.value = withTiming(
          SCREEN_WIDTH * 0.2,
          { duration: 150 },
          () => {
            runOnJS(onSwipeRight || defaultSwipeRight)();
            translateX.value = withTiming(0, { duration: 100 }, () => {
              isNavigating.value = false;
            });
          }
        );
      } else {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-15, 15]}
      failOffsetY={[-20, 20]}
      shouldCancelWhenOutside={true}
      enableTrackpadTwoFingerGesture={false}
      minPointers={1}
      maxPointers={1}
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
    backgroundColor: "#f8f9fa",
  },
});
