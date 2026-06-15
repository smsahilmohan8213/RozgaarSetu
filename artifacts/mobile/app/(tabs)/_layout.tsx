import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { ComponentProps } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type TabRouteName = "index" | "jobs" | "saved" | "profile" | "post-job" | "activity" | "nearby";

type TabConfig = {
  name: TabRouteName;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  isPrimary?: boolean;
};

// Single source of truth for route registration order
const ALL_ROUTES: TabRouteName[] = [
  "index",
  "jobs",
  "activity",
  "post-job",
  "profile",
  "saved",
  "nearby",
];

function getTabsForRole(user: ReturnType<typeof useApp>["user"]): TabConfig[] {
  // Guest (not authenticated) gets the same tabs regardless of selected role
  if (!user.isAuthenticated) {
    return [
      { name: "index", label: "Home", icon: "home-outline" },
      { name: "jobs", label: "Jobs", icon: "briefcase-outline" },
      { name: "profile", label: "Profile", icon: "person-outline" },
    ];
  }

  if (user.role === "employer") {
    return [
      { name: "index", label: "Home", icon: "home-outline" },
      { name: "jobs", label: "My Jobs", icon: "briefcase-outline" },
      { name: "post-job", label: "Post Job", icon: "add-circle-outline", isPrimary: true },
      { name: "profile", label: "Profile", icon: "person-outline" },
    ];
  }

  if (user.role === "seeker") {
    return [
      { name: "index", label: "Home", icon: "home-outline" },
      { name: "jobs", label: "Jobs", icon: "briefcase-outline" },
      { name: "activity", label: "Activity", icon: "notifications-outline" },
      { name: "profile", label: "Profile", icon: "person-outline" },
    ];
  }

  // Fallback
  return [
    { name: "index", label: "Home", icon: "home-outline" },
    { name: "jobs", label: "Jobs", icon: "briefcase-outline" },
    { name: "profile", label: "Profile", icon: "person-outline" },
  ];
}

function NativeTabBar(props: any) {
  const { state, navigation, descriptors, insets, tabs, activeColor, inactiveColor, pillColor } =
    props as {
      state: {
        index: number;
        routes: Array<{ key: string; name: string }>;
      };
      navigation: {
        emit: (event: { type: "tabPress" | "tabLongPress"; target: string; canPreventDefault?: boolean }) => {
          defaultPrevented: boolean;
        };
        navigate: (routeName: string) => void;
      };
      descriptors: Record<
        string,
        {
          options: {
            tabBarAccessibilityLabel?: string;
            tabBarButtonTestID?: string;
          };
        }
      >;
      insets: {
        bottom: number;
      };
      tabs: TabConfig[];
      activeColor: string;
      inactiveColor: string;
      pillColor: string;
    };
  const isIOS = Platform.OS === "ios";
  
  // Filter state routes so we only render buttons for the active role's tabs
  const visibleRouteNames = new Set(tabs.map((tab) => tab.name));
  const visibleRoutes = state.routes.filter((route) => visibleRouteNames.has(route.name as TabRouteName));

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View
        style={[
          styles.shell,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 12,
          },
        ]}
      >
        {isIOS ? (
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={["rgba(255,255,255,0.95)", "rgba(248,250,252,0.98)"]}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View
          style={[
            styles.bar,
            {
              backgroundColor: isIOS ? "rgba(255,255,255,0.82)" : "#FFFFFF",
              borderColor: "rgba(15, 23, 42, 0.06)",
            },
          ]}
        >
          {visibleRoutes.map((route) => {
            const tab = tabs.find((item) => item.name === route.name);
            if (!tab) return null;

            const routeIndex = state.routes.findIndex((item) => item.key === route.key);
            const isFocused = state.index === routeIndex;
            const descriptor = descriptors[route.key];
            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={descriptor.options.tabBarAccessibilityLabel ?? tab.label}
                testID={descriptor.options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabButton,
                  pressed && styles.tabButtonPressed,
                  tab.isPrimary && styles.primarySlot,
                ]}
              >
                <View
                  style={[
                    styles.tabPill,
                    tab.isPrimary && styles.primaryPill,
                    {
                      backgroundColor: isFocused
                        ? tab.isPrimary
                          ? activeColor
                          : "#EEF2FF"
                        : "transparent",
                      shadowColor: tab.isPrimary ? activeColor : "#0F172A",
                      shadowOffset: isFocused && tab.isPrimary ? { width: 0, height: 8 } : undefined,
                      shadowOpacity: isFocused && tab.isPrimary ? 0.3 : undefined,
                      shadowRadius: isFocused && tab.isPrimary ? 12 : undefined,
                      elevation: isFocused && tab.isPrimary ? 8 : 0,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isFocused
                        ? (tab.icon.replace("-outline", "") as ComponentProps<typeof Ionicons>["name"])
                        : tab.icon
                    }
                    size={tab.isPrimary ? 26 : 22}
                    color={tab.isPrimary && isFocused ? "#FFFFFF" : isFocused ? "#2563EB" : inactiveColor}
                    style={styles.icon}
                  />
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={[
                      styles.label,
                      tab.isPrimary && styles.primaryLabel,
                      {
                        color: tab.isPrimary && isFocused ? "#FFFFFF" : isFocused ? "#2563EB" : inactiveColor,
                        fontFamily: tab.isPrimary ? "Inter_700Bold" : isFocused ? "Inter_600SemiBold" : "Inter_500Medium",
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabLayout() {
  const { user } = useApp();
  const colors = useColors();
  const tabs = getTabsForRole(user);

  const activeColor = colors.primary ?? "#0A66C2";
  const inactiveColor = "#64748B";
  const pillColor = "rgba(10, 102, 194, 0.12)";

  // Predefine titles for standard screens
  const titles: Partial<Record<TabRouteName, string>> = {
    index: "Home",
    jobs: user.role === "employer" ? "My Jobs" : "Jobs",
    activity: "Activity",
    "post-job": "Post Job",
    profile: "Profile",
  };

  return (
    <Tabs
      tabBar={(props) => (
        <NativeTabBar
          {...props}
          tabs={tabs}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          pillColor={pillColor}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      {ALL_ROUTES.map((name) => {
        const isHidden = name === "saved" || name === "nearby";
        
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: titles[name],
              // Href null is strictly for routes that are permanently hidden from the tab bar but accessible via navigation.
              // It is NOT used for role switching.
              href: isHidden ? null : undefined,
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  shell: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderWidth: 1,
    borderRadius: 34,
    padding: 6,
    gap: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 20,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabPill: {
    minHeight: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    overflow: "hidden",
  } as ViewStyle,
  primarySlot: {
    transform: [{ translateY: -12 }],
  },
  primaryPill: {
    minHeight: 76,
    borderRadius: 38,
    paddingHorizontal: 8,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  } as ViewStyle,
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: "center",
    includeFontPadding: false,
  },
  primaryLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});

export default TabLayout;

