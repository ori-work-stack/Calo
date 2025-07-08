import { useRouter } from "expo-router";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

export const useSwipeNavigation = () => {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const navigateToCamera = () => {
    router.push("/(tabs)/camera");
  };

  const gestureHandler = useAnimatedGestureHandler({
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
      translateX.value = 0;
    },
  });

  return {
    gestureHandler,
    translateX,
  };
};
