import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

// Assuming these components and hooks exist and are correctly implemented
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground"; 
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ScrollableTabBar } from "@/components/ScrollableTabBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: isDarkMode
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(0, 0, 0, 0.6)",
        headerShown: false,
        tabBarButton: HapticTab, // Use your custom HapticTab if desired
        tabBarBackground: TabBarBackground, // Keep this if your TabBarBackground provides a specific blur/effect layer
        // We are moving tabBarStyle logic into ScrollableTabBar for better control
        // Forcing a fixed height for the custom tab bar, adjust as needed
        tabBarStyle: {
          height: Platform.OS === "ios" ? 90 : 60, // Base height, ScrollableTabBar will handle padding
          backgroundColor: "transparent", // Make the default tabBarStyle transparent
          borderTopWidth: 0, // Ensure no default border
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
      }}
      // Pass props to your custom tab bar component
      tabBar={(props) => <ScrollableTabBar {...props} />}
    >
      {/* CORRECTED TAB ORDER */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meals",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="fork.knife" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="watch.digital" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
      {/* RECOMMENDED MENUS IS NOW CORRECTLY PLACED BEFORE PROFILE */}
      <Tabs.Screen
        name="recommended-menus"
        options={{
          title: "Menus",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="dining" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
