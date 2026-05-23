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
  const { isJobSaved, toggleSaveJob, isJobApplied, user } = useApp();
  const isWeb = Platform.OS === "web";

  const job = JOBS.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Job not found</Text>
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
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? 67 : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          Job Details
        </Text>
        <TouchableOpacity onPress={onSave} style={styles.saveHeaderBtn}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={saved ? colors.primary : colors.foreground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 120 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {job.isUrgent && (
          <LinearGradient
            colors={[colors.urgent, colors.urgent + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.urgentBar}
          >
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.urgentBarText}>URGENT HIRING — Apply Today!</Text>
          </LinearGradient>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.companyRow}>
            <View style={[styles.logo, { backgroundColor: job.logoColor + "22" }]}>
              <Text style={[styles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
              <Text style={[styles.company, { color: colors.mutedForeground }]}>{job.company}</Text>
              <View style={styles.badges}>
                {job.isVerified && (
                  <View style={[styles.badge, { backgroundColor: colors.successFg }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={[styles.badgeText, { color: colors.success }]}>Verified</Text>
                  </View>
                )}
                {job.isTrusted && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>Trusted</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.salaryBlock, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="cash" size={20} color={colors.success} />
            <View>
              <Text style={[styles.salaryLabel, { color: colors.mutedForeground }]}>Monthly Salary</Text>
              <Text style={[styles.salaryValue, { color: colors.success }]}>{job.salary}</Text>
              {job.isNegotiable && (
                <Text style={[styles.negotiable, { color: colors.mutedForeground }]}>Negotiable</Text>
              )}
            </View>
          </View>

          <View style={styles.grid}>
            <GridItem icon="location-outline" label="Location" value={job.location} colors={colors} />
            <GridItem icon="navigate-outline" label="Distance" value={`${job.distanceKm} km away`} colors={colors} />
            <GridItem icon="briefcase-outline" label="Experience" value={job.experience} colors={colors} />
            <GridItem icon="people-outline" label="Job Type" value={job.jobType} colors={colors} />
            <GridItem icon="time-outline" label="Posted" value={job.postedTime} colors={colors} />
            <GridItem icon="person-outline" label="Applicants" value={`${job.applicants} applied`} colors={colors} />
          </View>

          {job.isFreshersOk && (
            <View style={[styles.fresherBanner, { backgroundColor: colors.accent }]}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.fresherText, { color: colors.primary }]}>
                Freshers are welcome to apply!
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About the Role</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{job.description}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Requirements</Text>
          {job.requirements.map((req, i) => (
            <View key={i} style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.reqText, { color: colors.foreground }]}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Report This Job</Text>
          <TouchableOpacity style={[styles.reportBtn, { borderColor: colors.border }]}>
            <Ionicons name="flag-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.reportText, { color: colors.mutedForeground }]}>
              Report fake or misleading job
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: isWeb ? 24 : insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp}>
          <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
          <Text style={styles.waBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: applied ? colors.success : colors.primary }]}
          onPress={onApply}
          disabled={applied}
        >
          <Text style={styles.applyBtnText}>
            {applied ? "Application Sent" : "Apply Now"}
          </Text>
          {!applied && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          {applied && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GridItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[gridStyles.item, { backgroundColor: colors.muted }]}>
      <Ionicons name={icon as "location-outline"} size={16} color={colors.primary} />
      <Text style={[gridStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[gridStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  item: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
  value: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveHeaderBtn: { padding: 4 },
  scroll: { padding: 16, gap: 12 },
  urgentBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 0,
  },
  urgentBarText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  card: { borderRadius: 20, padding: 18, borderWidth: 1 },
  companyRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  companyInfo: { flex: 1 },
  jobTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  company: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 6 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  salaryBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  salaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  salaryValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  negotiable: { fontSize: 11, fontFamily: "Inter_400Regular" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  fresherBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  fresherText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { borderRadius: 20, padding: 18, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  reqText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  reportText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#25D36618",
    borderWidth: 1,
    borderColor: "#25D36640",
  },
  waBtnText: { color: "#25D366", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  applyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  applyBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
