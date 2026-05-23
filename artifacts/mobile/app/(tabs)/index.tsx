import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { JobCard } from "@/components/JobCard";
import { SearchHeader } from "@/components/SearchHeader";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useApp } from "@/context/AppContext";
import { JOBS, LOCALITIES, type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

const GREETING_MAP: Record<string, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETING_MAP.morning;
  if (h < 17) return GREETING_MAP.afternoon;
  return GREETING_MAP.evening;
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, selectedLocality, setSelectedLocality } = useApp();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === "web";

  const urgentJobs = JOBS.filter((j) => j.isUrgent);
  const featuredJobs = JOBS.filter((j) => j.isVerified && j.isTrusted).slice(0, 5);
  const recentJobs = [...JOBS].sort((a, b) => a.postedTime.localeCompare(b.postedTime)).slice(0, 8);

  const filteredJobs = JOBS.filter((job) => {
    const matchSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());
    const matchLocality =
      selectedLocality === "All Areas" || job.location === selectedLocality;
    return matchSearch && matchLocality;
  });

  async function onRefresh() {
    setRefreshing(true);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRefreshing(false);
    setLoading(false);
  }

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchHeader
        greeting={getGreeting()}
        name={user.isAuthenticated ? user.name : "there"}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 100 : 100 },
        ]}
      >
        {!user.isAuthenticated && (
          <TouchableOpacity
            style={[styles.authBanner, { backgroundColor: colors.accent, borderColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.authTitle, { color: colors.primary }]}>
                Sign in for Better Matches
              </Text>
              <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
                Get personalized job alerts near you
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.localityScroll}
        >
          {LOCALITIES.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[
                styles.localityChip,
                {
                  backgroundColor:
                    selectedLocality === loc ? colors.primary : colors.card,
                  borderColor:
                    selectedLocality === loc ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedLocality(loc)}
            >
              <Text
                style={[
                  styles.localityText,
                  {
                    color:
                      selectedLocality === loc
                        ? "#fff"
                        : colors.foreground,
                  },
                ]}
              >
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {search.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Results for "{search}"
            </Text>
            {loading
              ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
              : filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}
            {!loading && filteredJobs.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="search" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No jobs found for "{search}"
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            <SectionHeader title="Urgent Hiring" icon="flash" onSeeAll={() => router.push("/(tabs)/jobs")} colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {urgentJobs.map((job) => (
                <View key={job.id} style={styles.horizontalCard}>
                  <JobCard job={job} compact />
                </View>
              ))}
            </ScrollView>

            <SectionHeader title="Featured Jobs" icon="star" onSeeAll={() => router.push("/(tabs)/jobs")} colors={colors} />
            {loading
              ? [1, 2].map((i) => <SkeletonCard key={i} />)
              : featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}

            <SectionHeader title="Recently Posted" icon="time" onSeeAll={() => router.push("/(tabs)/jobs")} colors={colors} />
            {loading
              ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
              : recentJobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  title,
  icon,
  onSeeAll,
  colors,
}: {
  title: string;
  icon: string;
  onSeeAll: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={secStyles.row}>
      <View style={secStyles.left}>
        <Ionicons name={icon as "flash"} size={18} color={colors.primary} />
        <Text style={[secStyles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={[secStyles.seeAll, { color: colors.primary }]}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    authBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
    },
    authTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    authSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    localityScroll: { gap: 8, paddingBottom: 16 },
    localityChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    localityText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    section: { marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
    horizontalScroll: { gap: 10, paddingBottom: 16 },
    horizontalCard: { width: 280 },
    empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
