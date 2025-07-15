import { Tabs } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { router } from "expo-router";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ScrollableTabBar } from "@/components/ScrollableTabBar";
import SwipeNavigationWrapper from "@/components/SwipeNavigationWrapper";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const routes = useMemo(
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
      "questionnaire",
    ],
    []
  );

  const handleSwipeLeft = useCallback(() => {
    router.push("/(tabs)/camera");
  }, []);

  const handleSwipeRight = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  return (
    <SwipeNavigationWrapper
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      threshold={120}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarStyle: {
            height: Platform.OS === "ios" ? 90 : 60,
            backgroundColor: "transparent",
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          ...(isRTL
            ? {
                tabBarLabelStyle: { writingDirection: "rtl" },
              }
            : {}),
        }}
        tabBar={(props) => <ScrollableTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: t("tabs.history"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="clock.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="camera"
          options={{
            title: t("tabs.camera"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="camera.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: t("tabs.statistics"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="chart.bar.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: t("tabs.calendar"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="calendar" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            title: t("tabs.devices"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="watch.digital" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recommended-menus"
          options={{
            title: t("tabs.recommended_menus"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="dining" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-chat"
          options={{
            title: t("tabs.ai_chat"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="message.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="questionnaire"
          options={{
            title: t("tabs.questionnaire"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="doc.text.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="food-scanner"
          options={{
            title: t("tabs.food_scanner"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="barcode.viewfinder" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </SwipeNavigationWrapper>
  );
}
