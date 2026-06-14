import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { ComponentProps, useEffect, useMemo, useState } from "react";
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
import { LOCALITIES, type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabaseClient";

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
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";
  const [employerMetrics, setEmployerMetrics] = useState({ activeJobs: 0, totalApplicants: 0, jobsPosted: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user.role !== "employer") return;

    async function fetchMetrics() {
      const sessionRes = await supabase.auth.getSession();
      const userId = sessionRes?.data?.session?.user?.id;
      if (!userId) return;

      try {
        const [jobsRes, activeRes, appsRes] = await Promise.all([
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("employer_id", userId),
          supabase.from("jobs").select("*", { count: "exact", head: true }).eq("employer_id", userId).eq("is_active", true),
          supabase.from("applications").select("*", { count: "exact", head: true })
        ]);

        // Note: The applications policy automatically limits to applications for this employer's jobs
        setEmployerMetrics({
          jobsPosted: jobsRes.count || 0,
          activeJobs: activeRes.count || 0,
          totalApplicants: appsRes.count || 0,
        });
      } catch (e) {
        console.log("[Employer Dashboard] Failed to load metrics", e);
      }
    }

    fetchMetrics();
  }, [user.role, refreshing]);

  const allJobs = postedJobs;
  const urgentJobs = useMemo(() => allJobs.filter((job) => job.isUrgent), [allJobs]);
  const nearbyJobs = useMemo(
    () => allJobs.filter((job) => job.location === selectedLocality || job.distanceKm <= 3),
    [allJobs, selectedLocality]
  );
  const featuredJobs = useMemo(
    () => allJobs.filter((job) => job.isVerified && job.isTrusted).slice(0, 8),
    [allJobs]
  );
  const recommendedJobs = useMemo(() => {
    return [...allJobs]
      .filter((job) => !job.isUrgent || job.distanceKm <= 5)
      .sort((a, b) => {
        const aScore = (a.isVerified ? 2 : 0) + (a.isTrusted ? 2 : 0) + (a.isFreshersOk ? 1 : 0) - a.distanceKm * 0.1;
        const bScore = (b.isVerified ? 2 : 0) + (b.isTrusted ? 2 : 0) + (b.isFreshersOk ? 1 : 0) - b.distanceKm * 0.1;
        return bScore - aScore;
      })
      .slice(0, 8);
  }, [allJobs]);
  const topCompanies = useMemo(() => {
    const grouped = new Map<string, { name: string; count: number; urgent: number }>();
    for (const job of allJobs) {
      const existing = grouped.get(job.company);
      if (existing) {
        existing.count += 1;
        existing.urgent += job.isUrgent ? 1 : 0;
      } else {
        grouped.set(job.company, { name: job.company, count: 1, urgent: job.isUrgent ? 1 : 0 });
      }
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.count - a.count || b.urgent - a.urgent)
      .slice(0, 8);
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      const matchSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.location.toLowerCase().includes(search.toLowerCase());
      const matchLocality = selectedLocality === "All Areas" || job.location === selectedLocality;
      return matchSearch && matchLocality;
    });
  }, [allJobs, search, selectedLocality]);

  async function onRefresh() {
    setRefreshing(true);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setRefreshing(false);
    setLoading(false);
  }

  const styles = getStyles(colors);

  if (user.role === "employer") {

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 100 : 110 }]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: isWeb ? 44 : 24 }]}
        >
          <Text style={styles.heroKicker}>Employer dashboard</Text>
          <Text style={styles.heroTitle}>Hire faster with a cleaner job desk</Text>
          <Text style={styles.heroSub}>
            Track active jobs, applicants, and posting flow from one place.
          </Text>

          <View style={styles.dashboardGrid}>
            <DashboardCard label="Active Jobs" value={String(employerMetrics.activeJobs)} icon="briefcase" />
            <DashboardCard label="Applicants" value={String(employerMetrics.totalApplicants)} icon="people" />
            <DashboardCard label="Jobs Posted" value={String(employerMetrics.jobsPosted)} icon="document-text" />
            <DashboardCard label="Job Views" value="--" icon="eye" note="Analytics soon" />
          </View>

          <View style={styles.quickActionsRow}>
            <DashboardAction
              icon="add-circle"
              label="Post Job"
              onPress={() => router.push("/post-job")}
              highlighted
            />
            <DashboardAction
              icon="briefcase"
              label="Manage Jobs"
              onPress={() => router.push("/(tabs)/jobs")}
            />
            <DashboardAction
              icon="people"
              label="View Applicants"
              onPress={() => {
                const firstJob = postedJobs[0];
                if (firstJob) {
                  router.push(`/employer/applicants/${firstJob.id}`);
                } else {
                  router.push("/(tabs)/jobs");
                }
              }}
            />
          </View>
        </LinearGradient>

        <SectionHeader title="Live Listings" subtitle={`${postedJobs.length} active jobs`} />
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : postedJobs.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No jobs yet"
            text="Post your first job to start receiving applicants."
            actionLabel="Post Job"
            onAction={() => router.push("/post-job")}
          />
        ) : (
          postedJobs.slice(0, 4).map((job) => (
            <EmployerPreviewRow
              key={job.id}
              job={job}
              onPress={() => router.push(`/employer/applicants/${job.id}`)}
            />
          ))
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <SearchHeader
        greeting={getGreeting()}
        name={user.isAuthenticated ? user.name : "there"}
        searchValue={search}
        onSearchChange={setSearch}
        onNotification={() => router.push("/notifications")}
      />

      <FlatList
        data={search.length > 0 ? filteredJobs : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 100 : 110 }]}
        ListHeaderComponent={
          <View>
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
                  activeOpacity={0.82}
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
              <SectionHeader title={`Results for "${search}"`} subtitle={`${filteredJobs.length} matches`} />
            ) : (
              <>
                <SectionHeader
                  title="Nearby Jobs"
                  subtitle={selectedLocality === "All Areas" ? "Near your area" : selectedLocality}
                  onSeeAll={() => router.push("/(tabs)/nearby")}
                />
                {loading ? (
                  <HorizontalSkeleton />
                ) : nearbyJobs.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {nearbyJobs.slice(0, 6).map((job) => (
                      <View key={job.id} style={styles.horizontalCard}>
                        <JobCard job={job} compact />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyInline
                    title="No nearby jobs"
                    text="Try another locality or refresh for more listings."
                  />
                )}

                <SectionHeader
                  title="Urgent Hiring"
                  subtitle={`${urgentJobs.length} active openings`}
                  onSeeAll={() => router.push("/(tabs)/jobs")}
                />
                {loading ? (
                  <HorizontalSkeleton />
                ) : urgentJobs.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {urgentJobs.slice(0, 6).map((job) => (
                      <View key={job.id} style={styles.horizontalCard}>
                        <JobCard job={job} compact />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyInline title="No urgent jobs" text="There are no urgent listings right now." />
                )}

                <SectionHeader
                  title="Featured Jobs"
                  subtitle="Verified and trusted employers"
                  onSeeAll={() => router.push("/(tabs)/jobs")}
                />
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : featuredJobs.length > 0 ? (
                  featuredJobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <EmptyInline title="No featured jobs" text="Featured listings will appear here soon." />
                )}

                <SectionHeader
                  title="Recommended Jobs"
                  subtitle="Picked for better matches"
                  onSeeAll={() => router.push("/(tabs)/jobs")}
                />
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : recommendedJobs.length > 0 ? (
                  recommendedJobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <EmptyInline title="No recommendations yet" text="Check back after saving or applying to jobs." />
                )}

                <SectionHeader
                  title="Top Companies"
                  subtitle="Companies with the most openings"
                />
                {loading ? (
                  <HorizontalSkeleton />
                ) : topCompanies.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.companyScroll}>
                    {topCompanies.map((company) => (
                      <View key={company.name} style={styles.companyCard}>
                        <Text style={styles.companyName} numberOfLines={1}>
                          {company.name}
                        </Text>
                        <Text style={styles.companyMeta}>{company.count} openings</Text>
                        <Text style={styles.companyHint}>{company.urgent} urgent</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <EmptyInline title="No companies yet" text="Company highlights will appear here." />
                )}
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          search.length > 0 ? (
            <EmptyState
              icon="search-outline"
              title="No jobs found"
              text="Try a different keyword or clear the filters."
              actionLabel="Clear Search"
              onAction={() => {
                setSearch("");
                setSelectedLocality("All Areas");
              }}
            />
          ) : null
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />
    </View>
  );
}

function DashboardCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  note?: string;
}) {
  return (
    <View style={dashStyles.card}>
      <View style={dashStyles.iconWrap}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <Text style={dashStyles.value}>{value}</Text>
      <Text style={dashStyles.label}>{label}</Text>
      {note ? <Text style={dashStyles.note}>{note}</Text> : null}
    </View>
  );
}

function DashboardAction({
  icon,
  label,
  onPress,
  highlighted = false,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  highlighted?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[actionStyles.card, highlighted && actionStyles.cardHighlighted]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[actionStyles.iconWrap, highlighted && actionStyles.iconWrapHighlighted]}>
        <Ionicons name={icon} size={20} color={highlighted ? "#fff" : "#2563EB"} />
      </View>
      <Text style={[actionStyles.label, highlighted && actionStyles.labelHighlighted]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmployerPreviewRow({
  job,
  onPress,
}: {
  job: Job;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={previewStyles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[previewStyles.logo, { backgroundColor: `${job.logoColor}18` }]}>
        <Text style={[previewStyles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
      </View>
      <View style={previewStyles.info}>
        <Text style={previewStyles.title} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={previewStyles.meta} numberOfLines={1}>
          {job.location} · {job.salary}
        </Text>
        <View style={previewStyles.row}>
          {job.isUrgent && (
            <View style={previewStyles.badgeUrgent}>
              <Ionicons name="flash" size={10} color="#DC2626" />
              <Text style={previewStyles.badgeTextUrgent}>Urgent</Text>
            </View>
          )}
          <View style={previewStyles.badgeApplicants}>
            <Ionicons name="people" size={10} color="#059669" />
            <Text style={previewStyles.badgeTextApplicants}>{job.applicants} applicants</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.left}>
        <Text style={sectionStyles.title}>{title}</Text>
        {subtitle ? <Text style={sectionStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onSeeAll ? (
        <TouchableOpacity style={sectionStyles.action} onPress={onSeeAll} activeOpacity={0.75}>
          <Text style={sectionStyles.actionText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color="#2563EB" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={emptyStateStyles.wrap}>
      <View style={emptyStateStyles.iconWrap}>
        <Ionicons name={icon} size={40} color="#2563EB" />
      </View>
      <Text style={emptyStateStyles.title}>{title}</Text>
      <Text style={emptyStateStyles.text}>{text}</Text>
      <TouchableOpacity style={emptyStateStyles.button} onPress={onAction}>
        <Text style={emptyStateStyles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyInline({ title, text }: { title: string; text: string }) {
  return (
    <View style={inlineStyles.wrap}>
      <Text style={inlineStyles.title}>{title}</Text>
      <Text style={inlineStyles.text}>{text}</Text>
    </View>
  );
}

function HorizontalSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={horizontalSkeletonStyles.scroll}
    >
      <View style={horizontalSkeletonStyles.card}>
        <SkeletonCard />
      </View>
      <View style={horizontalSkeletonStyles.card}>
        <SkeletonCard />
      </View>
    </ScrollView>
  );
}

const dashStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#475569",
    marginTop: 2,
  },
  note: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 2,
  },
});

const actionStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHighlighted: {
    backgroundColor: "#2563EB",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapHighlighted: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    textAlign: "center",
  },
  labelHighlighted: {
    color: "#fff",
  },
});

const previewStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badgeUrgent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  badgeTextUrgent: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#DC2626",
  },
  badgeApplicants: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
  },
  badgeTextApplicants: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#059669",
  },
});

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#2563EB",
  },
});

const emptyStateStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 28,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    textAlign: "center",
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});

const inlineStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 4,
  },
});

const horizontalSkeletonStyles = StyleSheet.create({
  scroll: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  card: {
    width: 290,
  },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingBottom: 16,
    },
    hero: {
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 28,
      padding: 18,
      overflow: "hidden",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
    heroKicker: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    heroTitle: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      marginTop: 8,
      lineHeight: 32,
    },
    heroSub: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.9)",
      marginTop: 8,
      lineHeight: 20,
    },
    dashboardGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 18,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    localityScroll: {
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 6,
    },
    localityChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#fff",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    localityChipActive: {
      backgroundColor: colors.primary,
    },
    localityText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    localityTextActive: {
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    horizontalScroll: {
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    horizontalCard: {
      width: 290,
    },
    companyScroll: {
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    companyCard: {
      width: 176,
      borderRadius: 20,
      backgroundColor: "#fff",
      padding: 14,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    companyName: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    companyMeta: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
      marginTop: 8,
    },
    companyHint: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });
}
