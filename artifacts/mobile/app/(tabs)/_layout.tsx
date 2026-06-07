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
  // NativeTabs on web can fall back to ▼ arrows when SF Symbols can't be resolved.
  // Force icons through Ionicons for consistent rendering.
  const { user } = useApp();
  const tabs = getTabsForRole(user.role);

  return (
    <NativeTabs>
      {/* Explicit screen order to avoid expo-router/unstable-native-tabs auto-sorting */}
      <NativeTabs.Trigger name="index">
        <Ionicons
          name={
            Platform.OS === "web"
              ? "home"
              : (tabs.find((t) => t.name === "index")?.androidIcon.unfocused as any) ?? "home"
          }
          size={22}
          color={"#94A3B8"}
        />
        <Label>{tabs.find((t) => t.name === "index")?.label ?? "Home"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <Ionicons
          name={
            Platform.OS === "web"
              ? "briefcase"
              : (tabs.find((t) => t.name === "jobs")?.androidIcon.unfocused as any) ?? "briefcase"
          }
          size={22}
          color={"#94A3B8"}
        />
        <Label>{tabs.find((t) => t.name === "jobs")?.label ?? "Jobs"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <Ionicons
          name={
            Platform.OS === "web"
              ? "notifications"
              : (tabs.find((t) => t.name === "activity")?.androidIcon.unfocused as any) ?? "notifications"
          }
          size={22}
          color={"#94A3B8"}
        />
        <Label>{tabs.find((t) => t.name === "activity")?.label ?? "Activity"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Ionicons
          name={
            Platform.OS === "web"
              ? "person"
              : (tabs.find((t) => t.name === "profile")?.androidIcon.unfocused as any) ?? "person"
          }
          size={22}
          color={"#94A3B8"}
        />
        <Label>{tabs.find((t) => t.name === "profile")?.label ?? "Profile"}</Label>
      </NativeTabs.Trigger>

      {/* Keep dynamic role-based tabs (e.g. employer) from breaking native trigger registration */}
      {tabs.some((t) => t.name === "post-job") ? (
        <NativeTabs.Trigger name="post-job">
          <Ionicons
            name={(tabs.find((t) => t.name === "post-job")?.androidIcon.unfocused as any) ?? "add-circle"}
            size={22}
            color={"#94A3B8"}
          />
          <Label>{tabs.find((t) => t.name === "post-job")?.label ?? "Post Job"}</Label>
        </NativeTabs.Trigger>
      ) : null}
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
      {/* Explicitly hide backup routes from the tab UI */}
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="nearby" options={{ href: null }} />

      {/* Explicitly hide/declare backup routes from the tab UI and lock screen order */}
      <Tabs.Screen name="index" options={{ title: tabs.find((t) => t.name === "index")?.label ?? "Home" }} />
      <Tabs.Screen name="jobs" options={{ title: tabs.find((t) => t.name === "jobs")?.label ?? "Jobs" }} />
      <Tabs.Screen
        name="activity"
        options={{
          title: tabs.find((t) => t.name === "activity")?.label ?? "Activity",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={
                  (focused ? tabs.find((t) => t.name === "activity")?.iosIcon : tabs.find((t) => t.name === "activity")?.iosIconUnfocused) as any
                }
                tintColor={color}
                size={24}
              />
            ) : (
              <Ionicons
                name={
                  (focused
                    ? tabs.find((t) => t.name === "activity")?.androidIcon.focused
                    : tabs.find((t) => t.name === "activity")?.androidIcon.unfocused) as any
                }
                size={22}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: tabs.find((t) => t.name === "profile")?.label ?? "Profile" }} />

      {/* Keep dynamic role-based tab (post-job) */}
      {tabs.some((t) => t.name === "post-job") ? (
        <Tabs.Screen
          name="post-job"
          options={{
            title: tabs.find((t) => t.name === "post-job")?.label ?? "Post Job",
            tabBarIcon: ({ color, focused }) =>
              isIOS ? (
                <SymbolView
                  name={
                    (focused
                      ? tabs.find((t) => t.name === "post-job")?.iosIcon
                      : tabs.find((t) => t.name === "post-job")?.iosIconUnfocused) as any
                  }
                  tintColor={color}
                  size={24}
                />
              ) : (
                <Ionicons
                  name={
                    (focused
                      ? tabs.find((t) => t.name === "post-job")?.androidIcon.focused
                      : tabs.find((t) => t.name === "post-job")?.androidIcon.unfocused) as any
                  }
                  size={22}
                  color={color}
                />
              ),
          }}
        />
      ) : null}
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
