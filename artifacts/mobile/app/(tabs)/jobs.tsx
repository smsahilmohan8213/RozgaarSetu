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
import { useApp } from "@/context/AppContext";
import { CATEGORIES, type JobCategory } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

type SortOption = "recent" | "salary" | "distance";

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { postedJobs } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  const allJobs = postedJobs;

  const filtered = allJobs.filter((job) => {
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
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top + 8 },
        ]}
      >
        <Text style={styles.title}>Find Jobs</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Job title, company..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : "#EEF2FF" }]}
            onPress={() => setShowFilters((p) => !p)}
          >
            <Ionicons name="options" size={16} color={showFilters ? "#fff" : colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {(["All", ...CATEGORIES] as (JobCategory | "All")[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: "#fff", borderColor: colors.border },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, { color: selectedCategory === cat ? "#fff" : colors.foreground }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showFilters && (
          <View style={[styles.filtersRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Sort by:</Text>
            {(["recent", "salary", "distance"] as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.sortChip, { backgroundColor: sortBy === opt ? colors.primary : "#EEF2FF" }]}
                onPress={() => setSortBy(opt)}
              >
                <Text style={[styles.sortText, { color: sortBy === opt ? "#fff" : colors.foreground }]}>
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
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.count}>{filtered.length} jobs found</Text>
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
    container: { flex: 1, backgroundColor: "#EEF2FF" },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
      shadowColor: "#3B5BDB",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: "#0F172A",
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 16,
      backgroundColor: "#F8FAFF",
      borderWidth: 1,
      borderColor: "#E2E8F0",
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
    categoryRow: { gap: 8, paddingBottom: 4 },
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
    filterLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    sortText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    list: { paddingHorizontal: 16, paddingTop: 12 },
    count: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 12 },
    empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  });
}
