import { useRouter } from "expo-router";
import {
  useAnimatedGestureHandler,
  useSharedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";

export const useSwipeNavigation = () => {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const navigateToCamera = () => {
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
      // Swipe right to camera (threshold: 100px)
      if (event.translationX > 100 && event.velocityX > 0) {
        runOnJS(navigateToCamera)();
      }
      translateX.value = withSpring(0);
    },
  });

  return {
    gestureHandler,
    translateX,
  };
};
