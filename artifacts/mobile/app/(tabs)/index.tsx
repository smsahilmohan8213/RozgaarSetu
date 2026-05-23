import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
  const { user, selectedLocality, setSelectedLocality, postedJobs } = useApp();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const isWeb = Platform.OS === "web";

  const allJobs = [...postedJobs, ...JOBS];
  const urgentJobs = allJobs.filter((j) => j.isUrgent);
  const featuredJobs = JOBS.filter((j) => j.isVerified && j.isTrusted).slice(0, 5);
  const recentJobs = [...postedJobs, ...JOBS].sort((a, b) => a.postedTime.localeCompare(b.postedTime)).slice(0, 8);

  const filteredJobs = allJobs.filter((job) => {
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
            style={styles.authBanner}
            onPress={() => router.push("/auth")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#EFF6FF", "#DBEAFE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.authBannerInner}
            >
              <View style={styles.authIconWrap}>
                <Ionicons name="person-circle" size={30} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.authTitle, { color: colors.primary }]}>
                  Sign in for Better Matches
                </Text>
                <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
                  Get personalized job alerts near you
                </Text>
              </View>
              <View style={[styles.authArrow, { backgroundColor: colors.primary }]}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
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
                selectedLocality === loc && styles.localityChipActive,
              ]}
              onPress={() => setSelectedLocality(loc)}
            >
              <Text
                style={[
                  styles.localityText,
                  selectedLocality === loc
                    ? styles.localityTextActive
                    : { color: colors.foreground },
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
            <SectionHeader
              title="Urgent Hiring"
              icon="flash"
              onSeeAll={() => router.push("/(tabs)/jobs")}
              colors={colors}
            />
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

            <SectionHeader
              title="Featured Jobs"
              icon="star"
              onSeeAll={() => router.push("/(tabs)/jobs")}
              colors={colors}
            />
            {loading
              ? [1, 2].map((i) => <SkeletonCard key={i} />)
              : featuredJobs.map((job) => <JobCard key={job.id} job={job} />)}

            <SectionHeader
              title="Recently Posted"
              icon="time"
              onSeeAll={() => router.push("/(tabs)/jobs")}
              colors={colors}
            />
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
        <View style={[secStyles.iconWrap, { backgroundColor: colors.accent }]}>
          <Ionicons name={icon as "flash"} size={14} color={colors.primary} />
        </View>
        <Text style={[secStyles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      <TouchableOpacity
        style={[secStyles.seeAllBtn, { backgroundColor: colors.accent }]}
        onPress={onSeeAll}
        activeOpacity={0.8}
      >
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
    marginTop: 8,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAll: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    authBanner: {
      borderRadius: 18,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    authBannerInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 18,
    },
    authIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    authTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    authSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    authArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    localityScroll: { gap: 8, paddingBottom: 16 },
    localityChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      shadowColor: "#3B5BDB",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    localityChipActive: {
      backgroundColor: colors.primary,
    },
    localityText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    localityTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
    section: { marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
    horizontalScroll: { gap: 10, paddingBottom: 16 },
    horizontalCard: { width: 280 },
    empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
