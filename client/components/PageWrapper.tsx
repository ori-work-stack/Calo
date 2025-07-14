import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect, usePathname } from "expo-router";
import SwipeNavigationWrapper from "./SwipeNavigationWrapper";
import TooltipBubble from "./TooltipBubble";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PageWrapperProps {
  children: React.ReactNode;
  showTooltip?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  showTooltip = true,
}) => {
  const [showTooltipBubble, setShowTooltipBubble] = useState(false);
  const pathname = usePathname();

  useFocusEffect(
    React.useCallback(() => {
      const checkTooltipVisibility = async () => {
        if (!showTooltip) return;

        try {
          const tooltipKey = `tooltip_shown_${pathname}`;
          const hasShown = await AsyncStorage.getItem(tooltipKey);

          if (!hasShown) {
            setShowTooltipBubble(true);
            await AsyncStorage.setItem(tooltipKey, "true");
          }
        } catch (error) {
          console.log("Error checking tooltip visibility:", error);
          // Fallback: show tooltip anyway
          setShowTooltipBubble(true);
        }
      };

      const timer = setTimeout(checkTooltipVisibility, 500);
      return () => clearTimeout(timer);
    }, [pathname, showTooltip])
  );

  const handleHideTooltip = () => {
    setShowTooltipBubble(false);
  };

  return (
    <SwipeNavigationWrapper currentRoute={pathname}>
      <View style={styles.container}>
        {children}
        {showTooltipBubble && (
          <View style={styles.tooltipContainer}>
            <TooltipBubble
              currentRoute={pathname}
              onHide={handleHideTooltip}
              duration={6000}
            />
          </View>
        )}
      </View>
    </SwipeNavigationWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tooltipContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
});
