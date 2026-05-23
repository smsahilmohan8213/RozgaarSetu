import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CATEGORIES, JOBS, type JobCategory } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

type SortOption = "recent" | "salary" | "distance";

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = JOBS.filter((job) => {
    const matchSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || job.category === selectedCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === "salary") return b.salaryMax - a.salaryMax;
    if (sortBy === "distance") return a.distanceKm - b.distanceKm;
    return 0;
  });

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? 67 : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Find Jobs</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Job title, company..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : colors.muted }]}
            onPress={() => setShowFilters((p) => !p)}
          >
            <Ionicons
              name="options"
              size={16}
              color={showFilters ? "#fff" : colors.foreground}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {(["All", ...CATEGORIES] as (JobCategory | "All")[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                {
                  backgroundColor:
                    selectedCategory === cat ? colors.primary : colors.card,
                  borderColor:
                    selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.catText,
                  { color: selectedCategory === cat ? "#fff" : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showFilters && (
          <View style={[styles.filtersRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
              Sort by:
            </Text>
            {(["recent", "salary", "distance"] as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      sortBy === opt ? colors.primary : colors.muted,
                  },
                ]}
                onPress={() => setSortBy(opt)}
              >
                <Text
                  style={[
                    styles.sortText,
                    { color: sortBy === opt ? "#fff" : colors.foreground },
                  ]}
                >
                  {opt === "recent" ? "Newest" : opt === "salary" ? "Salary" : "Nearest"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 100 : 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {filtered.length} jobs found
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No jobs match your search
            </Text>
          </View>
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    filterBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryRow: {
      gap: 8,
      paddingBottom: 4,
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    filtersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 1,
      flexWrap: "wrap",
    },
    filterLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    sortText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    list: { paddingHorizontal: 16, paddingTop: 12 },
    count: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },
    empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
