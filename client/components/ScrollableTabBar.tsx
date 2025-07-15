import React, { useRef, useEffect, useMemo, useCallback } from "react";
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
import { BlurView } from "expo-blur";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_ICONS_VISIBLE = 5;
const TAB_LABEL_FONT_SIZE = 10;
const TAB_ICON_SIZE = 24;
const ACTIVE_TAB_SCALE = 1.2;

export function ScrollableTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? "light"].tint;
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillScaleX = useRef(new Animated.Value(1)).current;
  const iconScales = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  const isDarkMode = colorScheme === "dark";

  // Memoize calculations instead of recalculating in useEffect
  const tabCalculations = useMemo(() => {
    const activeIndex = state.index;
    const routesCount = state.routes.length;
    const tabItemWidth =
      routesCount <= MAX_ICONS_VISIBLE
        ? SCREEN_WIDTH / routesCount
        : SCREEN_WIDTH / MAX_ICONS_VISIBLE;

    const pillTargetX = activeIndex * tabItemWidth + tabItemWidth / 2;
    const pillTargetScale = 0.7;

    const scrollOffset =
      routesCount > MAX_ICONS_VISIBLE
        ? Math.max(
            0,
            activeIndex * tabItemWidth - (SCREEN_WIDTH / 2 - tabItemWidth / 2)
          )
        : 0;

    return {
      activeIndex,
      routesCount,
      tabItemWidth,
      pillTargetX,
      pillTargetScale,
      scrollOffset,
      shouldScroll: routesCount > MAX_ICONS_VISIBLE,
    };
  }, [state.index, state.routes.length]);

  // Separate animation function
  const animateToTab = useCallback(
    (calculations: {
      activeIndex: any;
      pillTargetX: any;
      pillTargetScale: any;
      scrollOffset: any;
      shouldScroll: any;
    }) => {
      const {
        activeIndex,
        pillTargetX,
        pillTargetScale,
        scrollOffset,
        shouldScroll,
      } = calculations;

      // Animate pill
      Animated.parallel([
        Animated.spring(pillTranslateX, {
          toValue: pillTargetX,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.spring(pillScaleX, {
          toValue: pillTargetScale,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();

      // Animate icon scales
      iconScales.forEach((scale, index) => {
        Animated.spring(scale, {
          toValue: index === activeIndex ? ACTIVE_TAB_SCALE : 1,
          useNativeDriver: true,
          tension: 150,
          friction: 7,
        }).start();
      });

      // Handle scrolling
      if (shouldScroll) {
        scrollViewRef.current?.scrollTo({
          x: scrollOffset,
          animated: true,
        });
      } else {
        scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      }
    },
    [pillTranslateX, pillScaleX, iconScales]
  );

  // Focused useEffect only for animations
  useEffect(() => {
    animateToTab(tabCalculations);
  }, [tabCalculations, animateToTab]);

  // Rest of component remains the same...
  const tabContainerHeight = Platform.OS === "ios" ? 85 : 65;

  const colors = {
    background: isDarkMode
      ? "rgba(18, 18, 18, 0.95)"
      : "rgba(255, 255, 255, 0.95)",
    pillBackground: isDarkMode
      ? "rgba(255, 255, 255, 0.15)"
      : "rgba(0, 0, 0, 0.08)",
    activeIcon: tintColor,
    inactiveIcon: isDarkMode
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(0, 0, 0, 0.5)",
    activeLabel: tintColor,
    inactiveLabel: isDarkMode
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.7)",
    shadow: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.15)",
  };

  return (
    <View style={[styles.wrapper]}>
      {Platform.OS === "ios" && (
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFillObject}
          tint={isDarkMode ? "dark" : "light"}
        />
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            height: tabContainerHeight,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            tabCalculations.routesCount <= MAX_ICONS_VISIBLE && { flexGrow: 1 },
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
              ? colors.activeIcon
              : colors.inactiveIcon;
            const labelColor = isFocused
              ? colors.activeLabel
              : colors.inactiveLabel;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: isFocused,
                  disabled: isDisabled,
                }}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabButton,
                  {
                    width: tabCalculations.tabItemWidth,
                    opacity: isDisabled ? 0.4 : 1,
                  },
                ]}
                activeOpacity={0.8}
                disabled={isDisabled}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [{ scale: iconScales[index] }],
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

                <Animated.View
                  style={[
                    styles.labelContainer,
                    {
                      opacity: isFocused ? 1 : 0.8,
                      transform: [{ translateY: isFocused ? 0 : 2 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        color: labelColor,
                        fontWeight: isFocused ? "600" : "500",
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
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    backgroundColor: "transparent",
  },
  container: {
    position: "relative",
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollViewContent: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 2,
  },
  iconContainer: {
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 32,
  },
  labelContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 14,
  },
  label: {
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
