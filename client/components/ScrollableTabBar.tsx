import React, { useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_ICONS_VISIBLE = 5; // Max icons visible without scrolling
const INDICATOR_HEIGHT = 3; // Height of the active tab indicator line
const TAB_LABEL_FONT_SIZE = 11;
const TAB_ICON_SIZE = 28;

export function ScrollableTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;

  // Calculate dynamic width for each tab item
  const getTabItemWidth = (routesCount: number) => {
    return routesCount <= MAX_ICONS_VISIBLE
      ? SCREEN_WIDTH / routesCount
      : SCREEN_WIDTH / MAX_ICONS_VISIBLE;
  };

  // Auto-scroll to active tab and animate indicator
  useEffect(() => {
    const activeIndex = state.index;
    const routesCount = state.routes.length;
    const tabItemWidth = getTabItemWidth(routesCount);

    // Animate indicator position
    Animated.spring(indicatorTranslateX, {
      toValue: activeIndex * tabItemWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();

    // Auto-scroll logic to center the active tab
    if (routesCount > MAX_ICONS_VISIBLE) {
      const scrollOffset =
        activeIndex * tabItemWidth - (SCREEN_WIDTH / 2 - tabItemWidth / 2);

      scrollViewRef.current?.scrollTo({
        x: Math.max(0, scrollOffset),
        animated: true,
      });
    } else {
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [state.index, state.routes.length]);

  const isDarkMode = colorScheme === "dark";

  const backgroundColor = Platform.select({
    ios: isDarkMode ? "rgba(28, 28, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
    android: isDarkMode ? Colors.dark.background : Colors.light.background,
    default: isDarkMode ? Colors.dark.background : Colors.light.background,
  });

  const borderColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  const tabContainerHeight = Platform.OS === "ios" ? 90 : 60;
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          height: tabContainerHeight + bottomPadding,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {/* Active tab indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: tintColor,
            width: getTabItemWidth(state.routes.length) * 0.6,
            transform: [
              {
                translateX: indicatorTranslateX.interpolate({
                  inputRange: [0, SCREEN_WIDTH],
                  outputRange: [
                    getTabItemWidth(state.routes.length) * 0.2,
                    SCREEN_WIDTH + getTabItemWidth(state.routes.length) * 0.2,
                  ],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollViewContent,
          state.routes.length <= MAX_ICONS_VISIBLE && { flexGrow: 1 },
        ]}
        decelerationRate="fast"
        bounces={false}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const isDisabled = options.tabBarButton === null;

          const onPress = () => {
            if (isDisabled) return;

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            if (isDisabled) return;

            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconColor = isFocused
            ? tintColor
            : isDarkMode
            ? "rgba(255, 255, 255, 0.6)"
            : "rgba(0, 0, 0, 0.6)";

          const labelColor = isFocused
            ? tintColor
            : isDarkMode
            ? "rgba(255, 255, 255, 0.8)"
            : "rgba(0, 0, 0, 0.8)";

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused, disabled: isDisabled }}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                {
                  width: getTabItemWidth(state.routes.length),
                  opacity: isDisabled ? 0.4 : 1,
                },
              ]}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: isFocused ? 1.1 : 1,
                      },
                    ],
                  },
                ]}
              >
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      color: iconColor,
                      size: TAB_ICON_SIZE,
                      focused: isFocused,
                    })
                  : null}
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  {
                    color: labelColor,
                    fontWeight: isFocused ? "600" : "400",
                    fontSize: TAB_LABEL_FONT_SIZE,
                  },
                ]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {typeof label === "string"
                  ? label
                  : label?.toString() || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  scrollViewContent: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  tabButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 2,
  },
  label: {
    textAlign: "center",
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
});
