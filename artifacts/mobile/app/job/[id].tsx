import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
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
import { JOBS } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isJobSaved, toggleSaveJob, isJobApplied, user, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";

  const allJobs = [...postedJobs, ...JOBS];
  const job = allJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.notFound, { backgroundColor: "#EEF2FF" }]}>
        <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
        <Text style={{ color: "#64748B", fontFamily: "Inter_400Regular", marginTop: 12 }}>
          Job not found
        </Text>
      </View>
    );
  }

  const saved = isJobSaved(job.id);
  const applied = isJobApplied(job.id);

  async function onSave() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveJob(job!.id);
  }

  function onWhatsApp() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = encodeURIComponent(
      `Hi, I want to apply for the ${job!.title} position at ${job!.company} from RozgaarSetu.`
    );
    Linking.openURL(`https://wa.me/91${job!.whatsappNumber}?text=${msg}`);
  }

  function onApply() {
    if (!user.isAuthenticated) {
      router.push("/auth");
      return;
    }
    router.push(`/apply/${job!.id}`);
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Job Details</Text>
        <TouchableOpacity onPress={onSave} style={styles.saveHeaderBtn}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={saved ? "#2563EB" : "#64748B"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 130 : 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {job.isUrgent && (
          <View style={styles.urgentBar}>
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.urgentBarText}>URGENT HIRING — Apply Today!</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.companyRow}>
            <View style={[styles.logo, { backgroundColor: job.logoColor + "18" }]}>
              <Text style={[styles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
              <View style={styles.badges}>
                {job.isVerified && (
                  <View style={[styles.badge, { backgroundColor: "#D1FAE5" }]}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={[styles.badgeText, { color: "#059669" }]}>Verified</Text>
                  </View>
                )}
                {job.isTrusted && (
                  <View style={[styles.badge, { backgroundColor: "#DBEAFE" }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
                    <Text style={[styles.badgeText, { color: "#2563EB" }]}>Trusted</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.salaryBlock}>
            <Ionicons name="cash" size={22} color="#059669" />
            <View>
              <Text style={styles.salaryLabel}>Monthly Salary</Text>
              <Text style={styles.salaryValue}>{job.salary}</Text>
              {job.isNegotiable && <Text style={styles.negotiable}>Negotiable</Text>}
            </View>
          </View>

          <View style={styles.grid}>
            <GridItem icon="location-outline" label="Location" value={job.location} />
            <GridItem icon="navigate-outline" label="Distance" value={`${job.distanceKm} km away`} />
            <GridItem icon="briefcase-outline" label="Experience" value={job.experience} />
            <GridItem icon="people-outline" label="Job Type" value={job.jobType} />
            <GridItem icon="time-outline" label="Posted" value={job.postedTime} />
            <GridItem icon="person-outline" label="Applicants" value={`${job.applicants} applied`} />
          </View>

          {job.isFreshersOk && (
            <View style={styles.fresherBanner}>
              <Ionicons name="star" size={16} color="#2563EB" />
              <Text style={styles.fresherText}>Freshers are welcome to apply!</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Role</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req, i) => (
            <View key={i} style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.reqText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report This Job</Text>
          <TouchableOpacity style={styles.reportBtn}>
            <Ionicons name="flag-outline" size={16} color="#94A3B8" />
            <Text style={styles.reportText}>Report fake or misleading job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp} activeOpacity={0.8}>
          <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
          <Text style={styles.waBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyBtn, applied && { backgroundColor: "#059669" }]}
          onPress={onApply}
          disabled={applied}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>{applied ? "Applied!" : "Apply Now"}</Text>
          <Ionicons name={applied ? "checkmark-circle" : "arrow-forward"} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GridItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={gridStyles.item}>
      <Ionicons name={icon as "location-outline"} size={15} color="#2563EB" />
      <Text style={gridStyles.label}>{label}</Text>
      <Text style={gridStyles.value}>{value}</Text>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  item: {
    width: "48%",
    padding: 12,
    borderRadius: 14,
    gap: 3,
    marginBottom: 8,
    backgroundColor: "#F8FAFF",
  },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EEF2FF" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  saveHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16, gap: 14 },
  urgentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    marginBottom: 2,
  },
  urgentBarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  card: { borderRadius: 24, padding: 18, backgroundColor: "#ffffff", shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  companyRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  logo: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  companyInfo: { flex: 1 },
  jobTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 2 },
  company: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 6 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  salaryBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: "#F0FDF4",
  },
  salaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B" },
  salaryValue: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#059669" },
  negotiable: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  fresherBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginTop: 8, backgroundColor: "#DBEAFE" },
  fresherText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#2563EB" },
  section: { borderRadius: 24, padding: 18, backgroundColor: "#ffffff", shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 12 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, color: "#475569" },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  reqText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, color: "#0F172A" },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  reportText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#3B5BDB",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" },
  waBtnText: { color: "#16A34A", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  applyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: "#2563EB" },
  applyBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
