import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { useApp } from "@/context/AppContext";
import { JOBS } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

type Section = "applications" | "saved" | "recent" | "alerts" | "notifications";

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { savedJobIds, appliedJobIds, jobStatuses, user, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";

  const [activeSection, setActiveSection] = useState<Section>("applications");

  const allJobs = useMemo(() => [...postedJobs, ...JOBS], [postedJobs]);
  const savedJobs = useMemo(
    () => allJobs.filter((j) => savedJobIds.includes(j.id)),
    [allJobs, savedJobIds]
  );
  const appliedJobs = useMemo(
    () => allJobs.filter((j) => appliedJobIds.includes(j.id)),
    [allJobs, appliedJobIds]
  );

  const statusByJobId = jobStatuses ?? {};

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "shortlisted":
        return "#059669";
      case "rejected":
        return "#DC2626";
      case "viewed":
        return "#2563EB";
      case "applied":
        return "#2563EB";
      default:
        return "#94A3B8";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "shortlisted":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "viewed":
        return "eye";
      case "applied":
        return "hourglass";
      default:
        return "hourglass";
    }
  };

  const applicationsList = useMemo(() => {
    return appliedJobs.map((job) => ({
      job,
      status: statusByJobId[job.id],
    }));
  }, [appliedJobs, statusByJobId]);

  const notifications = useMemo(() => {
    const jobsById = new Map(allJobs.map((j) => [j.id, j]));

    const entries = Object.entries(statusByJobId) as Array<
      [string, "applied" | "viewed" | "shortlisted" | "rejected"]
    >;

    const items = entries
      .map(([jobId, status]) => {
        const job = jobsById.get(jobId);
        if (!job) return null;
        return { jobId, job, status };
      })
      .filter(Boolean) as Array<{ jobId: string; job: (typeof allJobs)[number]; status: any }>;

    // Use postedTime string ordering best-effort
    return items.sort((a, b) => (b.job.postedTime ?? "").localeCompare(a.job.postedTime ?? ""));
  }, [allJobs, statusByJobId]);

  const urgentJobsFromSaved = useMemo(
    () => savedJobs.filter((j) => j.isUrgent),
    [savedJobs]
  );
  const urgentJobsFromApplied = useMemo(
    () => appliedJobs.filter((j) => j.isUrgent),
    [appliedJobs]
  );

  const jobAlertsJobs = useMemo(() => {
    // Priority order:
    // 1. Shortlisted jobs
    // 2. Viewed jobs
    // 3. Urgent jobs from saved jobs
    // 4. Urgent jobs from applied jobs
    const jobsById = new Map(allJobs.map((j) => [j.id, j]));

    const shortlistedIds = Object.entries(statusByJobId)
      .filter(([, s]) => s === "shortlisted")
      .map(([id]) => id);

    const viewedIds = Object.entries(statusByJobId)
      .filter(([, s]) => s === "viewed")
      .map(([id]) => id);

    const shortlistedJobs = shortlistedIds
      .map((id) => jobsById.get(id))
      .filter(Boolean) as typeof allJobs;

    const viewedJobs = viewedIds
      .map((id) => jobsById.get(id))
      .filter(Boolean) as typeof allJobs;

    const shortlistedUnique = new Set(shortlistedJobs.map((j) => j.id));
    const viewedUnique = viewedJobs.filter((j) => !shortlistedUnique.has(j.id));

    const urgentSavedUnique = urgentJobsFromSaved.filter(
      (j) =>
        !shortlistedUnique.has(j.id) &&
        !viewedUnique.some((x) => x.id === j.id)
    );

    const urgentAppliedUnique = urgentJobsFromApplied.filter(
      (j) =>
        !shortlistedUnique.has(j.id) &&
        !viewedUnique.some((x) => x.id === j.id) &&
        !urgentSavedUnique.some((x) => x.id === j.id)
    );

    return [...shortlistedJobs, ...viewedUnique, ...urgentSavedUnique, ...urgentAppliedUnique];
  }, [allJobs, statusByJobId, urgentJobsFromSaved, urgentJobsFromApplied]);

  const recentActivityJobs = useMemo(() => {
    // Reuse existing state: applied/saved/status-updated jobs
    const ids = new Set<string>([
      ...appliedJobIds,
      ...savedJobIds,
      ...Object.keys(statusByJobId),
    ]);
    const jobs = allJobs.filter((j) => ids.has(j.id));
    return jobs.sort((a, b) => (b.postedTime ?? "").localeCompare(a.postedTime ?? ""));
  }, [allJobs, appliedJobIds, savedJobIds, statusByJobId]);

  const sectionTabs: Array<{ key: Section; icon: any; label: string }> = [
    { key: "applications", icon: "checkmark-done", label: "Applications" },
    { key: "saved", icon: "bookmark", label: "Saved Jobs" },
    { key: "recent", icon: "time", label: "Recent Activity" },
    { key: "alerts", icon: "flash", label: "Job Alerts" },
    { key: "notifications", icon: "notifications", label: "Notifications" },
  ];

  function EmptyState({
    icon,
    title,
    text,
    action,
  }: {
    icon: any;
    title: string;
    text: string;
    action?: { label: string; onPress: () => void };
  }) {
    return (
      <View style={styles.empty}>
        <Ionicons name={icon} size={44} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{text}</Text>
        {action ? (
          <TouchableOpacity style={styles.emptyBtn} onPress={action.onPress}>
            <Text style={styles.emptyBtnText}>{action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const renderJobCardWithOptionalStatus = ({ item }: { item: any }) => {
    const job = item.job ?? item;
    const status = item.status ?? statusByJobId[job.id];
    const showStatus = activeSection === "applications" || activeSection === "alerts";
    return (
      <View>
        <JobCard job={job} />
        {showStatus && status ? (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(status) + "15",
                borderLeftColor: getStatusColor(status),
              },
            ]}
          >
            <Ionicons
              name={getStatusIcon(status) as any}
              size={14}
              color={getStatusColor(status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.guestCenter}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="notifications" size={40} color="#2563EB" />
          </View>
          <Text style={styles.guestTitle}>Track Your Activity</Text>
          <Text style={styles.guestText}>Sign in to save jobs and track applications</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {sectionTabs.map((t) => {
          const active = activeSection === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveSection(t.key)}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={active ? colors.primary : "#94A3B8"}
              />
              <Text
                style={[
                  styles.tabText,
                  active && { color: colors.primary, fontFamily: "Inter_600SemiBold" },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSection === "applications" ? (
        applicationsList.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="No applications yet"
            text="Apply to jobs to track your progress"
            action={{ label: "Find Jobs", onPress: () => router.push("/(tabs)/jobs") }}
          />
        ) : (
          <FlatList
            data={applicationsList}
            keyExtractor={(item) => item.job.id}
            renderItem={renderJobCardWithOptionalStatus}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : activeSection === "saved" ? (
        savedJobs.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No saved jobs yet"
            text="Save jobs to find them quickly later"
            action={{ label: "Browse Jobs", onPress: () => router.push("/(tabs)/jobs") }}
          />
        ) : (
          <FlatList
            data={savedJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCardWithOptionalStatus}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : activeSection === "recent" ? (
        recentActivityJobs.length === 0 ? (
          <EmptyState
            icon="time"
            title="No activity yet"
            text="Your recent activity will show up here"
          />
        ) : (
          <FlatList
            data={recentActivityJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCardWithOptionalStatus}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : activeSection === "alerts" ? (
        jobAlertsJobs.length === 0 ? (
          <EmptyState
            icon="flash"
            title="No job alerts yet"
            text="You'll see updates for shortlisted/viewed and urgent jobs"
          />
        ) : (
          <FlatList
            data={jobAlertsJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCardWithOptionalStatus}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        notifications.length === 0 ? (
          <EmptyState icon="notifications-outline" title="No notifications" text="You’ll see status updates here" />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.jobId}
            renderItem={({ item }) => {
              const status = item.status;
              const statusColor = getStatusColor(status);
              const title =
                status === "shortlisted"
                  ? "You were shortlisted"
                  : status === "rejected"
                    ? "Application rejected"
                    : status === "viewed"
                      ? "Employer viewed your application"
                      : "Application updated";

              const iconName = getStatusIcon(status);

              return (
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: statusColor + "15",
                        borderLeftColor: statusColor,
                        marginHorizontal: 16,
                        marginBottom: 0,
                      },
                    ]}
                  >
                    <Ionicons name={iconName as any} size={16} color={statusColor} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusText, { color: "#0F172A", fontFamily: "Inter_700Bold", fontSize: 13 }]}>
                        {title}
                      </Text>
                      <Text style={[styles.statusText, { color: "#64748B", fontFamily: "Inter_400Regular", fontSize: 12 }]}>
                        {item.job.title} · {item.job.company}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingBottom: 2,
    flexWrap: "nowrap",
  },
  tab: {
    flex: 1,
    minWidth: 72,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563EB",
  },
  tabText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  guestCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  guestIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    marginTop: 16,
    textAlign: "center",
  },
  guestText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  signInBtn: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 12,
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: "#F8FAFF",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
