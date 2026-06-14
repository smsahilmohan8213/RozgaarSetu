import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

type ApplyStep = "confirm" | "sending" | "success";

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { applyToJob, user, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState<ApplyStep>("confirm");

  const job = postedJobs.find((j) => j.id === id);


  if (!job) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
        <Text style={styles.notFoundText}>Job not found</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.backHomeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleApply() {
    setStep("sending");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 1800));
    await applyToJob(job!.id);
    setStep("success");
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `Hi, I am ${user.name || "a job seeker"} and I want to apply for the ${job!.title} position at ${job!.company}. I found this on RozgaarSetu. Please let me know the next steps.`
    );
    Linking.openURL(`https://wa.me/91${job!.whatsappNumber}?text=${msg}`);
  }

  const completionPct = user.profileScore;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "success" ? "Application Sent!" : "Apply for Job"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 60 : insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SUCCESS STATE */}
        {step === "success" && (
          <View style={styles.successView}>
            <View style={styles.successAnim}>
              <LinearGradient
                colors={["#059669", "#10B981"]}
                style={styles.successCircle}
              >
                <Ionicons name="checkmark" size={56} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.successTitle}>Application Sent!</Text>
            <Text style={styles.successSub}>
              Your application for{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: "#0F172A" }}>
                {job.title}
              </Text>{" "}
              at {job.company} has been submitted.
            </Text>

            <View style={styles.trackCard}>
              <View style={[styles.trackIcon, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="time" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>What happens next?</Text>
                <Text style={styles.trackText}>
                  {job.company} will review your application and reach out via WhatsApp or call within 1–3 days.
                </Text>
              </View>
            </View>

            <View style={styles.trackCard}>
              <View style={[styles.trackIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="notifications" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>Stay alert</Text>
                <Text style={styles.trackText}>
                  Keep your WhatsApp (+91 {user.phone}) active. Employers contact directly.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.waFollowBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
              <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
              <Text style={styles.waFollowBtnText}>Also message on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(tabs)/saved")} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>View My Applications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push("/(tabs)")}>
              <Text style={styles.outlineBtnText}>Browse More Jobs</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SENDING STATE */}
        {step === "sending" && (
          <View style={styles.sendingView}>
            <LinearGradient colors={["#DBEAFE", "#EEF2FF"]} style={styles.sendingCircle}>
              <ActivityIndicator size="large" color="#2563EB" />
            </LinearGradient>
            <Text style={styles.sendingTitle}>Submitting Application</Text>
            <Text style={styles.sendingText}>Sending your details to {job.company}…</Text>
          </View>
        )}

        {/* CONFIRM STATE */}
        {step === "confirm" && (
          <>
            {/* Job card */}
            <View style={styles.jobCard}>
              <View style={[styles.jobLogo, { backgroundColor: job.logoColor + "18" }]}>
                <Text style={[styles.jobLogoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company}</Text>
                <Text style={styles.jobSalary}>{job.salary}</Text>
                <View style={styles.jobMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="location-outline" size={11} color="#64748B" />
                    <Text style={styles.metaChipText}>{job.location}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="briefcase-outline" size={11} color="#64748B" />
                    <Text style={styles.metaChipText}>{job.experience}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Profile readiness */}
            <View style={styles.profileCard}>
              <View style={styles.profileCardTop}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user.name ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{user.name || "Guest User"}</Text>
                  <Text style={styles.profilePhone}>+91 {user.phone || "XXXXXXXXXX"}</Text>
                </View>
                <View style={styles.profileScore}>
                  <Text style={styles.profileScoreNum}>{completionPct}%</Text>
                  <Text style={styles.profileScoreLabel}>ready</Text>
                </View>
              </View>

              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${completionPct}%` as `${number}%` }]} />
              </View>

              {user.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {user.skills.slice(0, 3).map((s) => (
                    <View key={s} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{s}</Text>
                    </View>
                  ))}
                  {user.skills.length > 3 && (
                    <Text style={styles.moreSkills}>+{user.skills.length - 3} more</Text>
                  )}
                </View>
              )}

              {user.resumeUploaded && (
                <View style={styles.resumeRow}>
                  <Ionicons name="document-attach" size={14} color="#059669" />
                  <Text style={styles.resumeText}>Resume attached</Text>
                </View>
              )}
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#2563EB" />
              <Text style={styles.infoText}>
                Your name and WhatsApp number will be shared with the employer. They may reach out directly.
              </Text>
            </View>

            {/* Apply button */}
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.applyBtnText}>Submit Application</Text>
            </TouchableOpacity>

            {/* WhatsApp option */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <View>
                <Text style={styles.waBtnTitle}>Apply via WhatsApp</Text>
                <Text style={styles.waBtnSub}>Message directly — often faster response</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#EEF2FF" },
  notFoundText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#64748B" },
  backHomeBtn: { backgroundColor: "#2563EB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backHomeBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0F172A", textAlign: "center" },
  scroll: { padding: 16, gap: 14 },

  /* Job card */
  jobCard: { flexDirection: "row", gap: 14, alignItems: "flex-start", backgroundColor: "#fff", borderRadius: 20, padding: 16, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  jobLogo: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  jobLogoText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  jobTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 2 },
  jobCompany: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 4 },
  jobSalary: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#059669", marginBottom: 8 },
  jobMeta: { flexDirection: "row", gap: 6 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  metaChipText: { fontSize: 11, color: "#64748B", fontFamily: "Inter_400Regular" },

  /* Profile card */
  profileCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  profileCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#2563EB" },
  profileName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  profilePhone: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B" },
  profileScore: { alignItems: "center", backgroundColor: "#EEF2FF", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  profileScoreNum: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#2563EB" },
  profileScoreLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#64748B" },
  scoreBar: { height: 6, borderRadius: 3, backgroundColor: "#EEF2FF", overflow: "hidden", marginBottom: 10 },
  scoreBarFill: { height: "100%", borderRadius: 3, backgroundColor: "#2563EB" },
  skillsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  skillChip: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#2563EB" },
  moreSkills: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", alignSelf: "center" },
  resumeRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: "flex-start" },
  resumeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#059669" },

  /* Info box */
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#BFDBFE" },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#1D4ED8", lineHeight: 19 },

  /* Buttons */
  applyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 18, backgroundColor: "#2563EB", shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  applyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  orText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  waBtnTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#16A34A" },
  waBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 2 },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#94A3B8" },

  /* Sending */
  sendingView: { alignItems: "center", paddingVertical: 80, gap: 20 },
  sendingCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  sendingTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0F172A" },
  sendingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B" },

  /* Success */
  successView: { alignItems: "center", paddingVertical: 20, gap: 14 },
  successAnim: { marginBottom: 8 },
  successCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#0F172A" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", lineHeight: 22, paddingHorizontal: 10 },
  trackCard: { flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 18, padding: 14, width: "100%", shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  trackIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  trackTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 3 },
  trackText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#64748B", lineHeight: 18 },
  waFollowBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", width: "100%", justifyContent: "center" },
  waFollowBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#16A34A" },
  primaryBtn: { width: "100%", paddingVertical: 15, borderRadius: 16, backgroundColor: "#2563EB", alignItems: "center", shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  outlineBtn: { width: "100%", paddingVertical: 13, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", backgroundColor: "#fff" },
  outlineBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#0F172A" },
});
