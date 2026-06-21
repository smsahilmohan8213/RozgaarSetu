import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
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

  const { postedJobs, updateApplicationStatus } = (() => {
    const ctx = useApp();
    return {
      postedJobs: ctx.postedJobs,
      updateApplicationStatus: ctx.updateApplicationStatus,
    };
  })();

  const isWeb = Platform.OS === "web";

  const job = useMemo(() => {
    return postedJobs.find((j) => j.id === jobId);
  }, [postedJobs, jobId]);

  type ApplicationRow = {
    id: string;
    applicant_id: string;
    applicant_name: string | null;
    phone: string | null;
    status: ApplicantStatus;
    applied_at: string;
    viewed_at: string | null;
    shortlisted_at: string | null;
    rejected_at: string | null;
    hired_at: string | null;
    resume_path: string | null;
    resume_url: string | null;
  };

  const hasResume = (a: ApplicationRow) => Boolean(a.resume_url || a.resume_path);

  const [applicants, setApplicants] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let mounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    void (async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id, applicant_id, status, applied_at, viewed_at, shortlisted_at, rejected_at, hired_at, resume_path, resume_url"
        )
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setErrorMsg(error.message);
        setApplicants([]);
        return;
      }

      const apps = (Array.isArray(data) ? data : []) as ApplicationRow[];
      
      if (apps.length > 0) {
        const applicantIds = Array.from(new Set(apps.map(a => a.applicant_id)));
        const { data: profilesData } = await supabase.from("profiles").select("id, full_name, phone").in("id", applicantIds);
        
        if (profilesData) {
          const profileMap = new Map(profilesData.map(p => [p.id, p]));
          apps.forEach(a => {
            const p = profileMap.get(a.applicant_id);
            if (p) {
              a.applicant_name = p.full_name;
              a.phone = p.phone;
            } else {
              a.applicant_name = "Unknown Applicant";
              a.phone = "";
            }
          });
        }
      }

      setApplicants(apps);
    })().finally(() => {
      if (!mounted) return;
      setIsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [jobId]);

  function getStatusPill(status: ApplicantStatus) {
    if (status === "shortlisted") return { text: "Shortlisted", bg: "#D1FAE5", color: "#059669", icon: "checkmark-circle" as const };
    if (status === "rejected") return { text: "Rejected", bg: "#FEE2E2", color: "#DC2626", icon: "close-circle" as const };
    if (status === "viewed") return { text: "Viewed", bg: "#DBEAFE", color: "#2563EB", icon: "eye" as const };
    return { text: "Applied", bg: "#DBEAFE", color: "#2563EB", icon: "hourglass" as const };
  }

  async function handleShortlist(applicantId: string) {
    if (!jobId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateApplicationStatus({
      jobId,
      applicantId,
      status: "shortlisted",
    });
  }


  async function handleReject(applicantId: string) {
    if (!jobId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateApplicationStatus({
      jobId,
      applicantId,
      status: "rejected",
    });
  }

  function handleViewResume(resumeUrl: string | null, resumePath: string | null) {
    const url = resumeUrl || (resumePath ? supabase.storage.from("resumes").getPublicUrl(resumePath).data.publicUrl : null);
    if (!url) {
      if (Platform.OS === "web") window.alert("Resume not available");
      else Alert.alert("Resume not available");
      return;
    }

    Linking.openURL(url);
  }

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
        {applicants.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={44} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No applicants yet</Text>
            <Text style={styles.emptySub}>When someone applies, they’ll show up here.</Text>
          </View>
        ) : (
          applicants.map((a) => {
            const pill = getStatusPill(a.status);

            return (
            <View key={a.id} style={styles.applicantCard}>
              <View style={[styles.pill, { backgroundColor: pill.bg, borderLeftColor: pill.color }]}>
                <Ionicons name={pill.icon as any} size={16} color={pill.color} />
                <Text style={[styles.pillText, { color: pill.color }]}>{pill.text}</Text>
              </View>

              <View style={styles.applicantTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {((a.applicant_name ?? "?")
                      .split(" ")
                      .filter(Boolean)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase() || "?")
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.applicantName}>{a.applicant_name ?? "Applicant"}</Text>
                  <Text style={styles.applicantMeta}>{a.phone ?? "—"}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.resumeStatus, { backgroundColor: a.resume_url || a.resume_path ? "#D1FAE5" : "#F1F5F9" }]}>
                  <Ionicons
                    name={a.resume_url || a.resume_path ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={a.resume_url || a.resume_path ? "#059669" : "#94A3B8"}
                  />
                  <Text style={[styles.resumeStatusText, { color: a.resume_url || a.resume_path ? "#059669" : "#64748B" }]}>
                    {a.resume_url || a.resume_path ? "Resume available" : "No resume"}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.applicantMeta}>Status: {a.status}</Text>
                <Text style={styles.applicantMeta}>Applied: {formatDate(a.applied_at)}</Text>
                <Text style={styles.applicantMeta}>Viewed: {formatDate(a.viewed_at ?? undefined)}</Text>
                <Text style={styles.applicantMeta}>Shortlisted: {formatDate(a.shortlisted_at ?? undefined)}</Text>
                <Text style={styles.applicantMeta}>Rejected: {formatDate(a.rejected_at ?? undefined)}</Text>
                <Text style={styles.applicantMeta}>Hired: {formatDate(a.hired_at ?? undefined)}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, !hasResume(a) && { backgroundColor: "#F1F5F9" }]}
                  onPress={() => handleViewResume(a.resume_url, a.resume_path)}
                  disabled={!hasResume(a)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document" size={18} color={hasResume(a) ? "#2563EB" : "#94A3B8"} />
                  <Text style={[styles.actionText, { color: hasResume(a) ? "#2563EB" : "#94A3B8" }]}>View Resume</Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}
                  onPress={() => handleShortlist(a.applicant_id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={18} color="#059669" />
                  <Text style={[styles.actionText, { color: "#059669" }]}>Shortlist</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#FFF5F5", borderColor: "#FECACA" }]}
                  onPress={() => handleReject(a.applicant_id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={18} color="#DC2626" />
                  <Text style={[styles.actionText, { color: "#DC2626" }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
            );
          })
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

