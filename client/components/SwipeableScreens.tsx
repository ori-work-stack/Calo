import React, { useState, useRef } from "react";
import { View, Dimensions } from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

interface SwipeableScreensProps {
  screens: React.ReactNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function SwipeableScreens({
  screens,
  initialIndex = 0,
  onIndexChange,
}: SwipeableScreensProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const translateX = useSharedValue(-initialIndex * screenWidth);

  const updateIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
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
      const shouldGoToNext =
        event.translationX < -screenWidth / 3 && event.velocityX < 0;
      const shouldGoToPrevious =
        event.translationX > screenWidth / 3 && event.velocityX > 0;

      let newIndex = currentIndex;

      if (shouldGoToNext && currentIndex < screens.length - 1) {
        newIndex = currentIndex + 1;
      } else if (shouldGoToPrevious && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      translateX.value = withSpring(-newIndex * screenWidth);

      if (newIndex !== currentIndex) {
        runOnJS(updateIndex)(newIndex);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            {
              flex: 1,
              flexDirection: "row",
              width: screenWidth * screens.length,
            },
            animatedStyle,
          ]}
        >
          {screens.map((screen, index) => (
            <View key={index} style={{ width: screenWidth, flex: 1 }}>
              {screen}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}
