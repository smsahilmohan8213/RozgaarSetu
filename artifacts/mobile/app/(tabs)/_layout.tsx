import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type TabConfig = {
  name: "index" | "jobs" | "activity" | "profile" | "post-job";
  label: string;
  iosIcon: any;
  iosIconUnfocused: any;
  androidIcon: { focused: string; unfocused: string };
  nativeIconSF: { default: any; selected: any };
};

function getTabsForRole(role: ReturnType<typeof useApp>["user"]["role"]): TabConfig[] {
  if (role === "employer") {
    return [
      {
        name: "index",
        label: "Home",
        iosIcon: "house.fill",
        iosIconUnfocused: "house",
        androidIcon: { focused: "home", unfocused: "home-outline" },
        nativeIconSF: { default: "house", selected: "house.fill" },
      },
      {
        name: "jobs",
        label: "Jobs",
        iosIcon: "briefcase.fill",
        iosIconUnfocused: "briefcase",
        androidIcon: { focused: "briefcase", unfocused: "briefcase-outline" },
        nativeIconSF: { default: "briefcase", selected: "briefcase.fill" },
      },
      {
        name: "post-job",
        label: "Post Job",
        iosIcon: "plus.square.on.square.fill",
        iosIconUnfocused: "plus.square.on.square",
        androidIcon: { focused: "add-circle", unfocused: "add-circle-outline" },
        nativeIconSF: { default: "plus.square.on.square", selected: "plus.square.on.square.fill" },
      },
      {
        name: "profile",
        label: "Profile",
        iosIcon: "person.fill",
        iosIconUnfocused: "person",
        androidIcon: { focused: "person", unfocused: "person-outline" },
        nativeIconSF: { default: "person", selected: "person.fill" },
      },
    ];
  }

  return [
    {
      name: "index",
      label: "Home",
      iosIcon: "house.fill",
      iosIconUnfocused: "house",
      androidIcon: { focused: "home", unfocused: "home-outline" },
      nativeIconSF: { default: "house", selected: "house.fill" },
    },
    {
      name: "jobs",
      label: "Jobs",
      iosIcon: "briefcase.fill",
      iosIconUnfocused: "briefcase",
      androidIcon: { focused: "briefcase", unfocused: "briefcase-outline" },
      nativeIconSF: { default: "briefcase", selected: "briefcase.fill" },
    },
    {
      name: "activity",
      label: "Activity",
      iosIcon: "bell.fill",
      iosIconUnfocused: "bell",
      androidIcon: { focused: "notifications", unfocused: "notifications-outline" },
      nativeIconSF: { default: "bell", selected: "bell.fill" },
    },
    {
      name: "profile",
      label: "Profile",
      iosIcon: "person.fill",
      iosIconUnfocused: "person",
      androidIcon: { focused: "person", unfocused: "person-outline" },
      nativeIconSF: { default: "person", selected: "person.fill" },
    },
  ];
}

function NativeTabLayout() {
  const { user } = useApp();
  const tabs = getTabsForRole(user.role);

  return (
    <NativeTabs>
      {tabs.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <Icon sf={t.nativeIconSF as any} />
          <Label>{t.label}</Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
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
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.label,
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView
                  name={focused ? t.iosIcon : t.iosIconUnfocused}
                  tintColor={color}
                  size={24}
                />
              ) : (
                <Ionicons
                  name={
                    (focused ? t.androidIcon.focused : t.androidIcon.unfocused) as any
                  }
                  size={22}
                  color={color}
                />
              ),
          }}
        />
      ))}
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
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
