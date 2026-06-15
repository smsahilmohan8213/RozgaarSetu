import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { SectionList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { ActivityEvent, ActivityType } from "@/data/activity";

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, applications, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";

  const isEmployer = user.role === "employer";

  // Filter activities based on role
  const roleActivities = useMemo(() => {
    const events: ActivityEvent[] = [];
    
    if (isEmployer) {
      // Employer events: New applicants for their jobs, or application reviews
      applications.forEach(app => {
        const job = postedJobs.find(j => j.id === app.jobId);
        if (!job) return; // Only show for jobs they posted

        events.push({
          id: `e_app_${app.id}`,
          type: "new_applicant",
          title: "New Applicant",
          description: `${app.name} applied for ${job.title}.`,
          timestamp: app.appliedDate,
          jobId: app.jobId,
          applicantId: app.id,
          isEmployerEvent: true,
        });

        if (app.status === "shortlisted" || app.status === "interview") {
          events.push({
            id: `e_rev_${app.id}`,
            type: "application_reviewed",
            title: "Application Reviewed",
            description: `You shortlisted ${app.name} for ${job.title}.`,
            // Mock a recent timestamp for the review action
            timestamp: new Date(new Date(app.appliedDate).getTime() + 1000 * 60 * 60).toISOString(),
            jobId: app.jobId,
            applicantId: app.id,
            isEmployerEvent: true,
          });
        }
      });
    } else {
      // Seeker events
      const myApps = applications.filter(a => a.name === user.name || a.name === "Guest User" || a.phone === user.phone);
      myApps.forEach(app => {
        const job = postedJobs.find(j => j.id === app.jobId);
        const companyName = job?.company || "Company";
        const jobTitle = job?.title || "Role";

        events.push({
          id: `s_app_${app.id}`,
          type: "application_submitted",
          title: "Application Submitted",
          description: `You applied for ${jobTitle} at ${companyName}.`,
          timestamp: app.appliedDate,
          jobId: app.jobId,
          isEmployerEvent: false,
        });

        if (app.status === "reviewed") {
          events.push({
            id: `s_rev_${app.id}`,
            type: "application_viewed",
            title: "Application Viewed",
            description: `${companyName} reviewed your application for ${jobTitle}.`,
            timestamp: new Date(new Date(app.appliedDate).getTime() + 1000 * 60 * 60).toISOString(),
            jobId: app.jobId,
            isEmployerEvent: false,
          });
        }

        if (app.status === "shortlisted") {
          events.push({
            id: `s_short_${app.id}`,
            type: "application_viewed",
            title: "Application Shortlisted",
            description: `Congratulations! ${companyName} shortlisted you for ${jobTitle}.`,
            timestamp: new Date(new Date(app.appliedDate).getTime() + 1000 * 60 * 60 * 2).toISOString(),
            jobId: app.jobId,
            isEmployerEvent: false,
          });
        }

        if (app.status === "rejected") {
          events.push({
            id: `s_rej_${app.id}`,
            type: "profile_updated",
            title: "Application Rejected",
            description: `Unfortunately, ${companyName} decided not to proceed with your application.`,
            timestamp: new Date(new Date(app.appliedDate).getTime() + 1000 * 60 * 60 * 2).toISOString(),
            jobId: app.jobId,
            isEmployerEvent: false,
          });
        }

        if (app.status === "interview") {
          events.push({
            id: `s_int_${app.id}`,
            type: "application_reviewed",
            title: "Interview Scheduled",
            description: `${companyName} scheduled an interview for ${app.interviewDate} at ${app.interviewTime}.`,
            timestamp: new Date(new Date(app.appliedDate).getTime() + 1000 * 60 * 60 * 3).toISOString(),
            jobId: app.jobId,
            isEmployerEvent: false,
          });
        }
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isEmployer, applications, postedJobs, user]);

  // Group by Today, This Week, Earlier
  const groupedActivities = useMemo(() => {
    const today: ActivityEvent[] = [];
    const thisWeek: ActivityEvent[] = [];
    const earlier: ActivityEvent[] = [];

    const nowTime = new Date().getTime();

    roleActivities.forEach(a => {
      const aTime = new Date(a.timestamp).getTime();
      const diffDays = (nowTime - aTime) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        today.push(a);
      } else if (diffDays < 7) {
        thisWeek.push(a);
      } else {
        earlier.push(a);
      }
    });

    const sections = [];
    if (today.length > 0) sections.push({ title: "Today", data: today });
    if (thisWeek.length > 0) sections.push({ title: "This Week", data: thisWeek });
    if (earlier.length > 0) sections.push({ title: "Earlier", data: earlier });

    return sections;
  }, [roleActivities]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "application_submitted": return "paper-plane";
      case "application_viewed": return "eye";
      case "profile_updated": return "person-circle";
      case "new_job_match": return "flash";
      case "new_applicant": return "person-add";
      case "application_reviewed": return "checkmark-done-circle";
      case "job_expiring": return "time";
      case "job_performance": return "stats-chart";
      default: return "ellipse";
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case "application_submitted": return "#2563EB";
      case "application_viewed": return "#8B5CF6";
      case "profile_updated": return "#10B981";
      case "new_job_match": return "#F59E0B";
      case "new_applicant": return "#2563EB";
      case "application_reviewed": return "#059669";
      case "job_expiring": return "#EF4444";
      case "job_performance": return "#3B82F6";
      default: return "#64748B";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  };

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
        </View>
        <View style={styles.guestCenter}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="pulse" size={40} color="#2563EB" />
          </View>
          <Text style={styles.guestTitle}>Track Your Journey</Text>
          <Text style={styles.guestText}>Sign in to view your personalized activity timeline.</Text>
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
        <Text style={styles.title}>Activity Timeline</Text>
      </View>

      <SectionList
        sections={groupedActivities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="pulse-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Your timeline will update as you interact with the platform.</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const color = getActivityColor(item.type);
          const isLast = index === section.data.length - 1;
          
          return (
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: color + "20" }]}>
                   <Ionicons name={getActivityIcon(item.type) as any} size={14} color={color} />
                </View>
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              
              <TouchableOpacity 
                style={styles.timelineCard} 
                activeOpacity={item.jobId ? 0.7 : 1}
                onPress={() => {
                  if (item.jobId) {
                    router.push(`/job/${item.jobId}`);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
                </View>
                <Text style={styles.cardDesc}>{item.description}</Text>
                {item.jobId && (
                  <View style={styles.actionRow}>
                     <Text style={styles.actionText}>View Details</Text>
                     <Ionicons name="chevron-forward" size={14} color="#2563EB" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0F172A" },
  list: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#64748B",
    marginTop: 10,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
    marginRight: 12,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginTop: -4,
    marginBottom: -16,
    zIndex: 1,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#475569",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#2563EB",
  },
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  guestCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  guestIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    textAlign: "center",
  },
  guestText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
  },
  signInBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
    backgroundColor: "#2563EB",
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
