import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type ApplicantStatus = "shortlisted" | "rejected" | "viewed" | "applied";

function formatDate(d: string | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

export default function EmployerApplicantsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, postedJobs, appliedJobIds, jobStatuses, isJobApplied, setJobStatus } = (() => {
    // typed extraction helper (keeps TypeScript clean)
    const ctx = useApp();
    return {
      user: ctx.user,
      postedJobs: ctx.postedJobs,
      appliedJobIds: ctx.appliedJobIds,
      jobStatuses: ctx.jobStatuses,
      isJobApplied: ctx.isJobApplied,
      setJobStatus: ctx.setJobStatus,
    };
  })();

  const isWeb = Platform.OS === "web";

  const job = useMemo(() => {
    return postedJobs.find((j) => j.id === jobId);
  }, [postedJobs, jobId]);

  const status: ApplicantStatus | undefined = useMemo(() => {
    if (!jobId) return undefined;
    return jobStatuses[jobId] as ApplicantStatus | undefined;
  }, [jobId, jobStatuses]);

  const applicants = useMemo(() => {

    // MVP constraint (approved): no backend & no applicant list state exists.
    // So we show only the current user if they applied to this job.
    if (!jobId) return [];
    if (!isJobApplied(jobId)) return [];


    return [
      {
        id: `self_${jobId}`,
        name: user.name || "Applicant",
        appliedAt: undefined as string | undefined,
        resumeAvailable: user.resumeUploaded,
      },
    ];
  }, [isJobApplied, jobId, user.name, user.resumeUploaded]);

  function getStatusPill() {
    if (!status) return null;
    if (status === "shortlisted") return { text: "Shortlisted", bg: "#D1FAE5", color: "#059669", icon: "checkmark-circle" as const };
    if (status === "rejected") return { text: "Rejected", bg: "#FEE2E2", color: "#DC2626", icon: "close-circle" as const };
    if (status === "viewed") return { text: "Viewed", bg: "#DBEAFE", color: "#2563EB", icon: "eye" as const };
    return { text: "Applied", bg: "#DBEAFE", color: "#2563EB", icon: "hourglass" as const };
  }

  async function handleShortlist() {
    if (!jobId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setJobStatus(jobId, "shortlisted");
  }

  async function handleReject() {
    if (!jobId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setJobStatus(jobId, "rejected");
  }

  function handleViewResume() {
    if (!user.resumeUri) {
      if (Platform.OS === "web") window.alert("Resume not available");
      else Alert.alert("Resume not available");
      return;
    }
    const url = user.resumeUri;
    Linking.openURL(url);
  }

  const pill = getStatusPill();

  if (!job) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <View style={styles.emptyCenter}>
          <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>Job not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Applicants
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {job.title} · {job.company}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 100 : insets.bottom + 120 }]}
      >
        {pill && (
          <View style={[styles.pill, { backgroundColor: pill.bg, borderLeftColor: pill.color }]}>
            <Ionicons name={pill.icon as any} size={16} color={pill.color} />
            <Text style={[styles.pillText, { color: pill.color }]}>{pill.text}</Text>
          </View>
        )}

        {applicants.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={44} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No applicants yet</Text>
            <Text style={styles.emptySub}>When someone applies, they’ll show up here.</Text>
          </View>
        ) : (
          applicants.map((a) => (
            <View key={a.id} style={styles.applicantCard}>
              <View style={styles.applicantTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(a.name.split(" ").filter(Boolean).map((w) => w[0]).join("") || "?").toUpperCase().slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.applicantName}>{a.name}</Text>
                  <Text style={styles.applicantMeta}>Applied: {formatDate(a.appliedAt)}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.resumeStatus, { backgroundColor: a.resumeAvailable ? "#D1FAE5" : "#F1F5F9" }]}>
                  <Ionicons
                    name={a.resumeAvailable ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={a.resumeAvailable ? "#059669" : "#94A3B8"}
                  />
                  <Text style={[styles.resumeStatusText, { color: a.resumeAvailable ? "#059669" : "#64748B" }]}>
                    {a.resumeAvailable ? "Resume available" : "No resume"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, !a.resumeAvailable && { backgroundColor: "#F1F5F9" }]}
                  onPress={handleViewResume}
                  disabled={!a.resumeAvailable}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document" size={18} color={a.resumeAvailable ? "#2563EB" : "#94A3B8"} />
                  <Text style={[styles.actionText, { color: a.resumeAvailable ? "#2563EB" : "#94A3B8" }]}>View Resume</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]} onPress={handleShortlist} activeOpacity={0.85}>
                  <Ionicons name="checkmark" size={18} color="#059669" />
                  <Text style={[styles.actionText, { color: "#059669" }]}>Shortlist</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FFF5F5", borderColor: "#FECACA" }]} onPress={handleReject} activeOpacity={0.85}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                  <Text style={[styles.actionText, { color: "#DC2626" }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0F172A" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B", marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  pill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderLeftWidth: 4, marginBottom: 12 },
  pillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  emptyCenter: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  emptyText: { marginTop: 12, fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B" },
  backBtn: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#2563EB", borderRadius: 14 },
  backBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  empty: { marginTop: 22, alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#0F172A" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", paddingHorizontal: 10 },

  applicantCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, marginBottom: 14 },
  applicantTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#2563EB" },
  applicantName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0F172A" },
  applicantMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B", marginTop: 2 },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  resumeStatus: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  resumeStatusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, backgroundColor: "#EEF2FF" },
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});

