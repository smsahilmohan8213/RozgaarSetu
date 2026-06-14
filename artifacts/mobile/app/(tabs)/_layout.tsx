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

type HiddenTabName = "activity" | "nearby";

function getTabsForRole(role: ReturnType<typeof useApp>["user"]["role"]): TabConfig[] {
  if (role === "employer") {
    return [
      { name: "index", label: "Home", icon: "home-outline" },
      { name: "jobs", label: "My Jobs", icon: "briefcase-outline" },
      { name: "post-job", label: "Post Job", icon: "add-circle-outline", isPrimary: true },
      { name: "profile", label: "Profile", icon: "person-outline" },
    ];
  }

  return [
    { name: "index", label: "Home", icon: "home-outline" },
    { name: "jobs", label: "Jobs", icon: "briefcase-outline" },
    { name: "saved", label: "Saved", icon: "bookmark-outline" },
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
                          : pillColor
                        : "transparent",
                      shadowColor: tab.isPrimary ? activeColor : "#0F172A",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      isFocused
                        ? (tab.icon.replace("-outline", "") as ComponentProps<typeof Ionicons>["name"])
                        : tab.icon
                    }
                    size={tab.isPrimary ? 24 : 21}
                    color={tab.isPrimary && isFocused ? "#FFFFFF" : isFocused ? activeColor : inactiveColor}
                    style={styles.icon}
                  />
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={[
                      styles.label,
                      tab.isPrimary && styles.primaryLabel,
                      {
                        color: tab.isPrimary && isFocused ? "#FFFFFF" : isFocused ? activeColor : inactiveColor,
                        fontFamily: tab.isPrimary ? "Inter_700Bold" : "Inter_500Medium",
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
  const tabs = getTabsForRole(user.role);

  const activeColor = colors.primary ?? "#0A66C2";
  const inactiveColor = "#64748B";
  const pillColor = "rgba(10, 102, 194, 0.12)";

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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
          }}
        />
      ))}

      {(
        [
          user.role === "seeker" ? "post-job" : "saved",
          "activity",
          "nearby",
        ] as Array<HiddenTabName | "saved" | "post-job">
      ).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: null,
          }}
        />
      ))}
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderWidth: 1,
    borderRadius: 30,
    padding: 8,
    gap: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabPill: {
    minHeight: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
  } as ViewStyle,
  primarySlot: {
    transform: [{ translateY: -8 }],
  },
  primaryPill: {
    minHeight: 72,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
