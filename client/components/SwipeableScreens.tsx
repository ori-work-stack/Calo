import React, { useState, useRef } from "react";
import {
  View,
  Dimensions,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

interface SwipeableScreensProps {
  screens: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const { width: screenWidth } = Dimensions.get("window");

export const SwipeableScreens: React.FC<SwipeableScreensProps> = ({
  screens,
  currentIndex,
  onIndexChange,
}) => {
  const translateX = useSharedValue(-currentIndex * screenWidth);

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        context.startX = translateX.value;
      },
      onActive: (event, context) => {
        translateX.value = context.startX + event.translationX;
      },
      onEnd: (event) => {
        const shouldMoveToNext =
          event.translationX < -screenWidth / 3 &&
          currentIndex < screens.length - 1;
        const shouldMoveToPrevious =
          event.translationX > screenWidth / 3 && currentIndex > 0;

        if (shouldMoveToNext) {
          translateX.value = withSpring(-(currentIndex + 1) * screenWidth);
          runOnJS(onIndexChange)(currentIndex + 1);
        } else if (shouldMoveToPrevious) {
          translateX.value = withSpring(-(currentIndex - 1) * screenWidth);
          runOnJS(onIndexChange)(currentIndex - 1);
        } else {
          translateX.value = withSpring(-currentIndex * screenWidth);
        }
      },
    });

  React.useEffect(() => {
    translateX.value = withSpring(-currentIndex * screenWidth);
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            {
              flexDirection: "row",
              width: screens.length * screenWidth,
            },
            animatedStyle,
          ]}
        >
          {screens.map((screen, index) => (
            <View key={index} style={{ width: screenWidth }}>
              {screen}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
