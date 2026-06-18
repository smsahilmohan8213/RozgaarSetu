import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { ComponentProps, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AuthModal } from "@/components/AuthModal";
import { JobCard } from "@/components/JobCard";
import { SearchHeader } from "@/components/SearchHeader";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useApp } from "@/context/AppContext";
import { LOCALITIES, type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabaseClient";

const TRENDING_COMPANIES = [
  { name: "Zomato", color: "#E23744", logoImage: require("../../assets/images/company-logos/zomato.png") },
  { name: "Blinkit", color: "#F8CB46", logoImage: require("../../assets/images/company-logos/blinkit.png") },
  { name: "Swiggy", color: "#FC8019", logoImage: require("../../assets/images/company-logos/swiggy.png") },
  { name: "Urban Company", color: "#000000", logoImage: require("../../assets/images/company-logos/uc.png") },
  { name: "BigBasket", color: "#84C225", logoImage: require("../../assets/images/company-logos/bigbasket.png") },
  { name: "Zepto", color: "#3B0060", logoImage: require("../../assets/images/company-logos/zepto.png") },
];

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
  const { user, selectedLocality, setSelectedLocality, postedJobs, applications, savedJobIds, requireAuth } = useApp();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const requireAuthAction = (action: () => void, options?: { title?: string; description?: string; maybeLaterText?: string }) => {
    requireAuth(action, options);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user.role !== "employer") return;

    // Use pure local state to satisfy Phase 8 requirements
    const activeJobs = postedJobs.filter(j => true).length; // using true since status override is handled in AppContext locally
    
    // Total applicants across all jobs belonging to this employer
    const totalApps = applications.length;
    const upcomingInterviews = applications.filter(a => a.status === "interview").length;
    
    setEmployerMetrics({
      jobsPosted: postedJobs.length,
      activeJobs: activeJobs,
      totalApplicants: totalApps,
      upcomingInterviews,
    });
  }, [user.role, refreshing, postedJobs, applications]);

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
          <Text style={styles.heroKicker}>{t("Employer dashboard")}</Text>
          <Text style={styles.heroTitle}>{t("Hire faster with a cleaner job desk")}</Text>
          <Text style={styles.heroSub}>
            {t("Track active jobs, applicants, and posting flow from one place.")}
          </Text>

          <View style={styles.dashboardGrid}>
            <DashboardCard label={t("Active Jobs")} value={String(employerMetrics.activeJobs)} icon="briefcase" />
            <DashboardCard label={t("Applicants")} value={String(employerMetrics.totalApplicants)} icon="people" />
            <DashboardCard label={t("Interviews")} value={String(employerMetrics.upcomingInterviews)} icon="calendar" />
            <DashboardCard label={t("Jobs Posted")} value={String(employerMetrics.jobsPosted)} icon="document-text" />
          </View>

          <View style={styles.quickActionsRow}>
            <DashboardAction
              icon="add-circle"
              label={t("Post Job")}
              onPress={() => requireAuthAction(() => router.push("/post-job"), { title: t("Sign in to Post Job"), description: t("Create an employer account to post jobs."), maybeLaterText: t("Maybe Later") })}
              highlighted
            />
            <DashboardAction
              icon="briefcase"
              label={t("Manage Jobs")}
              onPress={() => requireAuthAction(() => router.push("/(tabs)/jobs"), { title: t("Sign in to Manage Jobs"), description: t("Create an employer account to manage your jobs."), maybeLaterText: t("Maybe Later") })}
            />
            <DashboardAction
              icon="people"
              label={t("View Applicants")}
              onPress={() => requireAuthAction(() => {
                const firstJob = postedJobs[0];
                if (firstJob) {
                  router.push(`/employer/applicants/${firstJob.id}`);
                } else {
                  router.push("/(tabs)/jobs");
                }
              }, { title: t("Sign in to View Applicants"), description: t("Create an employer account to view applicants."), maybeLaterText: t("Maybe Later") })}
            />
          </View>
        </LinearGradient>

        <SectionHeader title={t("Live Listings")} subtitle={`${postedJobs.length} ${t("active jobs")}`} />
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : postedJobs.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("No jobs yet")}
            text={t("Post your first job to start receiving applicants.")}
            actionLabel={t("Post Job")}
            onAction={() => requireAuthAction(() => router.push("/post-job"), { title: t("Sign in to Post Job"), description: t("Create an employer account to post jobs."), maybeLaterText: t("Maybe Later") })}
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

        <SectionHeader title={t("Top Performing Job")} subtitle={t("Most applications received")} />
        {postedJobs.length > 0 ? (
          <EmployerPreviewRow
            job={[...postedJobs].sort((a,b) => b.applicants - a.applicants)[0]}
            onPress={() => router.push(`/employer/applicants/${[...postedJobs].sort((a,b) => b.applicants - a.applicants)[0].id}`)}
          />
        ) : (
          <EmptyInline title={t("No data yet")} text={t("Your top performing job will appear here.")} />
        )}

        <SectionHeader title={t("Recent Applicants")} subtitle={t("Candidates who applied recently")} />
        {applications.slice(0, 3).length > 0 ? applications.slice(0, 3).map(app => (
           <View key={app.id} style={styles.recentApplicantRow}>
             <View style={styles.raAvatar}>
               <Text style={styles.raAvatarText}>{app.name.charAt(0)}</Text>
             </View>
             <View style={styles.raInfo}>
               <Text style={styles.raName}>{app.name}</Text>
               <Text style={styles.raMeta}>{app.experience} · {app.location}</Text>
             </View>
             <TouchableOpacity 
               style={styles.raBtn}
               onPress={() => router.push(`/employer/applicants/${app.jobId}`)}
             >
               <Text style={styles.raBtnText}>{t("Review")}</Text>
             </TouchableOpacity>
           </View>
        )) : (
          <EmptyInline title={t("No applicants yet")} text={t("When job seekers apply, they'll appear here.")} />
        )}

        <SectionHeader title={t("Upcoming Interviews")} subtitle={t("Interviews scheduled")} />
        {applications.filter(a => a.status === "interview").slice(0, 3).length > 0 ? applications.filter(a => a.status === "interview").slice(0, 3).map(app => (
           <View key={app.id + "iv"} style={styles.interviewRow}>
             <View style={styles.ivDateBox}>
               <Text style={styles.ivDateDay}>{new Date(app.interviewDate || "").getDate()}</Text>
               <Text style={styles.ivDateMonth}>{new Date(app.interviewDate || "").toLocaleString('default', { month: 'short' })}</Text>
             </View>
             <View style={styles.ivInfo}>
               <Text style={styles.ivName}>{app.name}</Text>
               <Text style={styles.ivMeta}>{app.interviewTime}</Text>
             </View>
             <TouchableOpacity 
               style={styles.raBtn}
               onPress={() => router.push(`/employer/applicants/${app.jobId}`)}
             >
               <Text style={styles.raBtnText}>{t("View")}</Text>
             </TouchableOpacity>
           </View>
        )) : (
          <EmptyInline title={t("No interviews scheduled")} text={t("Shortlist applicants to schedule interviews.")} />
        )}


      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <SearchHeader
        greeting={`${t(getGreeting())}${user.name && user.name !== "Guest User" ? `, ${user.name}` : ""}`}
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
            <View style={styles.localityScroll}>
              {!user.isAuthenticated && (
                <TouchableOpacity
                  style={styles.signInPromoCard}
                  onPress={() => requireAuthAction(() => {}, { title: t("Sign in to continue"), description: t("Create an account to unlock all RozgaarSetu features."), maybeLaterText: t("Maybe Later") })}
                  activeOpacity={0.9}
                >
                  <View style={styles.signInPromoIconWrap}>
                    <Ionicons name="person-circle" size={46} color="#94A3B8" />
                  </View>
                  <View style={styles.signInPromoTextContainer}>
                    <Text style={styles.signInPromoTitle}>{t("Sign in for Better Matches")}</Text>
                    <Text style={styles.signInPromoSub}>{t("Get personalized job alerts near you")}</Text>
                  </View>
                  <View style={styles.signInPromoBtn}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
              {user.isAuthenticated && (
                <LinearGradient
                  colors={["#1D4ED8", "#2563EB", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.seekerHero}
                >
                  <Text style={styles.seekerHeroTitle}>{t(getGreeting())}, {user.name.split(" ")[0] || t("Guest")}{"\n"}{t("Find jobs near you")}</Text>
                  <Text style={styles.seekerHeroSub}>{t("Explore thousands of local opportunities tailored for you.")}</Text>
                  <TouchableOpacity style={styles.seekerHeroBtn} onPress={() => router.push("/(tabs)/jobs")}>
                    <Text style={styles.seekerHeroBtnText}>{t("Quick Apply")}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#2563EB" />
                  </TouchableOpacity>
                </LinearGradient>
              )}

              {user.isAuthenticated && (
                <View style={[styles.dashboardGrid, { marginTop: 16 }]}>
                   <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: "#2563EB" }]}>{seekerAppsCount}</Text>
                      <Text style={styles.statLabel}>{t("Applications")}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: "#059669" }]}>{seekerInterviewsCount}</Text>
                      <Text style={styles.statLabel}>{t("Interviews")}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: "#D97706" }]}>{savedJobIds.length}</Text>
                      <Text style={styles.statLabel}>{t("Saved Jobs")}</Text>
                    </View>
                </View>
              )}

              <SectionHeader title={t("Popular Localities")} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.localityScrollInner}
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

              {user.isAuthenticated && search.length === 0 && (
                <>
                  <SectionHeader title={t("Trending Companies")} subtitle={t("Top delivery & gig brands")} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.companyScroll}>
                    {TRENDING_COMPANIES.map((company) => (
                      <View key={company.name} style={styles.trendingCard}>
                        <View style={[styles.trendingLogo, { backgroundColor: `${company.color}15`, padding: 8 }]}>
                          <Image source={company.logoImage} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="contain" />
                        </View>
                        <Text style={styles.trendingName} numberOfLines={1}>{company.name}</Text>
                        <TouchableOpacity style={styles.trendingApplyBtn} onPress={() => router.push("/(tabs)/jobs")}>
                          <Text style={styles.trendingApplyText}>{t("View Jobs")}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {search.length > 0 ? (
              <SectionHeader title={`${t("Results for")} "${search}"`} subtitle={`${filteredJobs.length} ${t("matches")}`} />
            ) : (
              <>
                {user.isAuthenticated && (
                  <>
                    <SectionHeader
                      title={t("Nearby Jobs")}
                      subtitle={selectedLocality === "All Areas" ? t("Near your area") : selectedLocality}
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
                        title={t("No nearby jobs")}
                        text={t("Try another locality or refresh for more listings.")}
                      />
                    )}
                  </>
                )}

                <SectionHeader
                  title={t("Urgent Hiring")}
                  subtitle={`${urgentJobs.length} ${t("active openings")}`}
                  onSeeAll={() => router.push("/(tabs)/jobs?filter=urgent")}
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
                  <EmptyInline title={t("No urgent jobs")} text={t("There are no urgent listings right now.")} />
                )}

                <SectionHeader
                  title={t("Featured Jobs")}
                  subtitle={t("Verified and trusted employers")}
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
                  <EmptyInline title={t("No featured jobs")} text={t("Featured listings will appear here soon.")} />
                )}

                {!user.isAuthenticated && (
                  <>
                    <SectionHeader title={t("Trending Companies")} subtitle={t("Top delivery & gig brands")} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.companyScroll}>
                      {TRENDING_COMPANIES.map((company) => (
                        <View key={company.name} style={styles.trendingCard}>
                          <View style={[styles.trendingLogo, { backgroundColor: `${company.color}15`, padding: 8 }]}>
                            <Image source={company.logoImage} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="contain" />
                          </View>
                          <Text style={styles.trendingName} numberOfLines={1}>{company.name}</Text>
                          <TouchableOpacity style={styles.trendingApplyBtn} onPress={() => router.push("/(tabs)/jobs")}>
                            <Text style={styles.trendingApplyText}>{t("View Jobs")}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

                {user.isAuthenticated && (
                  <>
                    <SectionHeader
                      title={t("Recommended Jobs")}
                      subtitle={t("Picked for better matches")}
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
                      <EmptyInline title={t("No recommendations yet")} text={t("Check back after saving or applying to jobs.")} />
                    )}

                    <SectionHeader
                      title={t("Top Companies")}
                      subtitle={t("Companies with the most openings")}
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
                            <Text style={styles.companyMeta}>{company.count} {t("openings")}</Text>
                            <Text style={styles.companyHint}>{company.urgent} {t("urgent")}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      <EmptyInline title={t("No companies yet")} text={t("Company highlights will appear here.")} />
                    )}
                  </>
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
  onPress,
}: {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  note?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={dashStyles.card}>
      <View style={dashStyles.iconWrap}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <Text style={dashStyles.value}>{value}</Text>
      <Text style={dashStyles.label}>{label}</Text>
      {note ? <Text style={dashStyles.note}>{note}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ width: "48%" }}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
    filterSectionTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginTop: 20,
      marginBottom: 10,
    },
    recentApplicantRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#F1F5F9",
      marginHorizontal: 16,
    },
    raAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#DBEAFE",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    raAvatarText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#1E3A8A",
    },
    raInfo: {
      flex: 1,
    },
    raName: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#0F172A",
    },
    raMeta: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "#64748B",
    },
    raBtn: {
      backgroundColor: "#EEF2FF",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    raBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: "#2563EB",
    },
    interviewRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },
    ivDateBox: {
      backgroundColor: "#EEF2FF",
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      minWidth: 50,
    },
    ivDateDay: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: "#2563EB",
    },
    ivDateMonth: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: "#3B82F6",
      textTransform: "uppercase",
    },
    ivInfo: {
      flex: 1,
    },
    ivName: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#0F172A",
    },
    ivMeta: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: "#64748B",
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
      gap: 0,
      paddingHorizontal: 0,
      paddingTop: 6,
      paddingBottom: 6,
      flexDirection: "column",
    },
    localityScrollInner: {
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 6,
    },
    seekerHero: {
      marginHorizontal: 16,
      marginTop: 6,
      borderRadius: 24,
      padding: 20,
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    seekerHeroTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    seekerHeroSub: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.85)",
      marginTop: 6,
      marginBottom: 16,
    },
    seekerHeroBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff",
      alignSelf: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
    },
    seekerHeroBtnText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: "#2563EB",
    },
    trendingCard: {
      width: 130,
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 14,
      alignItems: "center",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    trendingLogo: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    trendingLogoText: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
    },
    trendingName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: "#0F172A",
      marginBottom: 10,
    },
    trendingApplyBtn: {
      backgroundColor: "#EEF2FF",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    trendingApplyText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: "#2563EB",
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
    signInPromoCard: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#E0E7FF",
    },
    signInPromoIconWrap: {
      marginRight: 12,
    },
    signInPromoTextContainer: {
      flex: 1,
      marginRight: 12,
    },
    signInPromoTitle: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#0F172A",
      marginBottom: 2,
    },
    signInPromoSub: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "#64748B",
    },
    signInPromoBtn: {
      backgroundColor: "#2563EB",
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
