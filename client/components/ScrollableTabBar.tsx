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
      useNativeDriver: true, // Use native driver for performance if possible
      tension: 100,
      friction: 10,
    }).start();

    // Auto-scroll logic to center the active tab
    if (routesCount > MAX_ICONS_VISIBLE) {
      const scrollOffset =
        activeIndex * tabItemWidth - (SCREEN_WIDTH / 2 - tabItemWidth / 2); // Centers the active tab

      scrollViewRef.current?.scrollTo({
        x: Math.max(0, scrollOffset), // Ensure scroll doesn't go negative
        animated: true,
      });
    } else {
      // If not scrollable, ensure it's at the beginning (no scroll)
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [state.index, state.routes.length]); // Depend on state.index and route count

  const isDarkMode = colorScheme === "dark";

  // Using specific rgba values for a consistent translucent effect
  const backgroundColor = Platform.select({
    ios: isDarkMode ? "rgba(28, 28, 30, 0.9)" : "rgba(255, 255, 255, 0.9)",
    android: isDarkMode ? Colors.dark.background : Colors.light.background, // Android typically doesn't use backdropFilter
    default: isDarkMode ? Colors.dark.background : Colors.light.background,
  });

  const borderColor = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  const tabContainerHeight = Platform.OS === "ios" ? 90 : 60; // Fixed height to match TabLayout
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 10; // Safe area padding

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderTopColor: borderColor,
          // Calculate actual height including safe area padding
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
            // Calculate width for indicator (e.g., 60% of tab item width, centered)
            width: getTabItemWidth(state.routes.length) * 0.6,
            // Adjust translateX for centering the indicator within its tab
            transform: [
              {
                translateX: indicatorTranslateX.interpolate({
                  inputRange: [0, SCREEN_WIDTH], // Adjust inputRange if necessary based on max scroll
                  outputRange: [
                    getTabItemWidth(state.routes.length) * 0.2, // Starting offset
                    SCREEN_WIDTH + getTabItemWidth(state.routes.length) * 0.2, // Max offset
                  ],
                  extrapolate: "clamp", // Prevent indicator from going beyond bounds
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
          // If fewer tabs than MAX_ICONS_VISIBLE, make them fill the screen width evenly
          state.routes.length <= MAX_ICONS_VISIBLE && { flexGrow: 1 },
        ]}
        // Remove snapToInterval for smoother scrolling or adjust it carefully
        // snapToInterval={getTabItemWidth(state.routes.length)} // Can cause issues if not perfectly aligned
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
              accessibilityRole="tab" // ✅ Use "tab" here instead of "button"
              accessibilityState={{ selected: isFocused, disabled: isDisabled }} // ✅ Show selected & disabled states
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
                    // Scale icon slightly when focused
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
                {label.toString()}
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
    // Styling of the overall tab bar container
    borderTopWidth: StyleSheet.hairlineWidth,
    position: "relative", // Needed for absolute positioning of indicator
    overflow: "hidden", // Helps with indicator animation
    justifyContent: "flex-end", // Aligns content to the bottom
    // The actual background and height are set dynamically in component
  },
  scrollViewContent: {
    flexDirection: "row", // Ensure items are laid out horizontally
    alignItems: "center", // Vertically center content in the scroll view
    height: "100%", // Take full height of the container minus bottom padding
  },
  tabButton: {
    flexDirection: "column", // Stack icon and label vertically
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    // Width set dynamically in component
  },
  iconContainer: {
    marginBottom: 2, // Space between icon and label
    // No fixed height or width here, let icon size dictate it
  },
  label: {
    textAlign: "center",
  },
  indicator: {
    position: "absolute",
    top: 0, // Position at the very top of the tab bar
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    // Width and transform (left position) handled by Animated values
  },
});
