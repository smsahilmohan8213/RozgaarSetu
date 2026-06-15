import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

interface JobCardProps {
  job: Job;
  compact?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function JobCard({ job, compact = false }: JobCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { isJobSaved, toggleSaveJob, isJobApplied, requireAuth } = useApp();
  const scale = useSharedValue(1);
  const saved = isJobSaved(job.id);
  const applied = isJobApplied(job.id);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function onPressIn() {
    scale.value = withSpring(0.975, { damping: 20 });
  }
  function onPressOut() {
    scale.value = withSpring(1, { damping: 20 });
  }
  function onPress() {
    router.push(`/job/${job.id}`);
  }
  async function onSave() {
    requireAuth(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleSaveJob(job.id);
    });
  }
  function onWhatsApp() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = encodeURIComponent(
      `Hi, I want to apply for the ${job.title} position at ${job.company} from RozgaarSetu.`
    );
    Linking.openURL(`https://wa.me/91${job.whatsappNumber}?text=${msg}`);
  }

  const styles = getStyles(colors);

  return (
    <AnimatedTouchable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      {job.isUrgent && (
        <View style={styles.urgentBanner}>
          <Ionicons name="flash" size={10} color="#fff" />
          <Text style={styles.urgentText}>URGENT HIRING</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: job.logoColor + "18" }]}>
          <Text style={[styles.logoText, { color: job.logoColor }]}>
            {job.logoInitials}
          </Text>
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.titleRow}>
            <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
              {job.title}
            </Text>
            <TouchableOpacity onPress={onSave} style={styles.saveBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? colors.primary : "#CBD5E1"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.companyRow}>
            <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {job.company}
            </Text>
            {job.isVerified && (
              <View style={[styles.badge, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="checkmark-circle" size={11} color="#059669" />
                <Text style={[styles.badgeText, { color: "#059669" }]}>Verified</Text>
              </View>
            )}
            {job.isTrusted && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Ionicons name="shield-checkmark" size={11} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>Trusted</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.salaryStrip, { backgroundColor: "#F0FDF4" }]}>
        <Ionicons name="cash-outline" size={15} color="#059669" />
        <Text style={styles.salaryText}>{job.salary}</Text>
        {job.isNegotiable && (
          <Text style={[styles.negotiable, { color: colors.mutedForeground }]}> · Negotiable</Text>
        )}
        {job.isFreshersOk && (
          <View style={styles.fresherBadge}>
            <Text style={[styles.fresherText, { color: colors.primary }]}>Freshers OK</Text>
          </View>
        )}
      </View>

      {!compact && (
        <View style={styles.metaGrid}>
          <MetaChip icon="location-outline" label={`${job.location} · ${job.distanceKm} km`} colors={colors} />
          <MetaChip icon="briefcase-outline" label={job.experience} colors={colors} />
          <MetaChip icon="time-outline" label={job.postedTime} colors={colors} />
          <MetaChip icon="people-outline" label={`${job.applicants} applied`} colors={colors} />
        </View>
      )}

      {compact && (
        <View style={styles.compactMeta}>
          <MetaChip icon="location-outline" label={job.location} colors={colors} />
          <MetaChip icon="time-outline" label={job.postedTime} colors={colors} />
        </View>
      )}

      {!compact && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.applyBtn, applied && { backgroundColor: "#059669" }]}
            onPress={() => requireAuth(() => router.push(`/apply/${job.id}`))}
            disabled={applied}
            activeOpacity={0.85}
          >
            <Ionicons name={applied ? "checkmark" : "send"} size={15} color="#fff" />
            <Text style={styles.applyBtnText}>{applied ? "Applied" : "Apply Now"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp} activeOpacity={0.8}>
            <MaterialCommunityIcons name="whatsapp" size={17} color="#25D366" />
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </AnimatedTouchable>
  );
}

function MetaChip({ icon, label, colors }: { icon: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: "#F1F5F9" }]}>
      <Ionicons name={icon as "location-outline"} size={11} color="#64748B" />
      <Text style={chipStyles.chipText}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 11,
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "System" : "Inter_400Regular",
  },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#3B5BDB",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    urgentBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.urgent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 10,
    },
    urgentText: {
      fontSize: 10,
      color: "#fff",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.6,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 12,
    },
    logo: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    headerMeta: { flex: 1 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    jobTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      flex: 1,
      marginRight: 8,
    },
    saveBtn: { padding: 2 },
    companyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      flexWrap: "wrap",
    },
    companyName: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 20,
    },
    badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    salaryStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 14,
      marginBottom: 12,
    },
    salaryText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#059669",
      flex: 1,
    },
    negotiable: { fontSize: 12, fontFamily: "Inter_400Regular" },
    fresherBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
    },
    fresherText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 14,
    },
    compactMeta: {
      flexDirection: "row",
      gap: 6,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    applyBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 14,
    },
    applyBtnText: {
      color: "#fff",
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    waBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#F0FDF4",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#BBF7D0",
    },
    waBtnText: {
      color: "#16A34A",
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
    },
  });
}
