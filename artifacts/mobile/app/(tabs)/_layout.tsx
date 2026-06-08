import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type TabConfig = {
  name: "index" | "jobs" | "activity" | "profile" | "post-job";
  label: string;
  ionIcon: { focused: string; unfocused: string };
};

function getTabsForRole(role: ReturnType<typeof useApp>["user"]["role"]): TabConfig[] {
  if (role === "employer") {
    return [
      {
        name: "index",
        label: "Home",
        ionIcon: { focused: "home", unfocused: "home-outline" },
      },
      {
        name: "jobs",
        label: "Jobs",
        ionIcon: { focused: "briefcase", unfocused: "briefcase-outline" },
      },
      {
        name: "post-job",
        label: "Post Job",
        ionIcon: { focused: "add-circle", unfocused: "add-circle-outline" },
      },
      {
        name: "profile",
        label: "Profile",
        ionIcon: { focused: "person", unfocused: "person-outline" },
      },
    ];
  }

  return [
    {
      name: "index",
      label: "Home",
      ionIcon: { focused: "home", unfocused: "home-outline" },
    },
    {
      name: "jobs",
      label: "Jobs",
      ionIcon: { focused: "briefcase", unfocused: "briefcase-outline" },
    },
    {
      name: "activity",
      label: "Activity",
      ionIcon: { focused: "notifications", unfocused: "notifications-outline" },
    },
    {
      name: "profile",
      label: "Profile",
      ionIcon: { focused: "person", unfocused: "person-outline" },
    },
  ];
}

function ClassicTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { user } = useApp();

  const tabs = getTabsForRole(user.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginTop: 1,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#FFFFFF",
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: insets.bottom,
          shadowColor: "#3B5BDB",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          ...(isWeb ? { height: 80 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint="light"
              style={[StyleSheet.absoluteFill, styles.tabBarBg]}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF" }]} />
          ) : null,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={(focused ? tab.ionIcon.focused : tab.ionIcon.unfocused) as any}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}

      {/* Hidden tabs (accessible via direct navigation, not shown in tab bar) */}
      <Tabs.Screen
        name="saved"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBg: {
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
});

export default function TabLayout() {
  return <ClassicTabLayout />;
}
