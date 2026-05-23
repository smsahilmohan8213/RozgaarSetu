import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface SearchHeaderProps {
  greeting?: string;
  name?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onNotification?: () => void;
}

export function SearchHeader({
  greeting = "Good morning",
  name = "there",
  searchValue,
  onSearchChange,
  onNotification,
}: SearchHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: isWeb ? 67 : insets.top + 8,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting} 👋
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.muted }]}
          onPress={onNotification}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          <View style={[styles.notifDot, { backgroundColor: colors.urgent }]} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search jobs, companies, skills..."
          placeholderTextColor={colors.mutedForeground}
          value={searchValue}
          onChangeText={onSearchChange}
        />
        {searchValue.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: 10,
    right: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
