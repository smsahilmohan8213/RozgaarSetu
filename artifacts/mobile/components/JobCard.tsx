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
  const { isJobSaved, toggleSaveJob, isJobApplied } = useApp();
  const scale = useSharedValue(1);
  const saved = isJobSaved(job.id);
  const applied = isJobApplied(job.id);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function onPressIn() {
    scale.value = withSpring(0.97, { damping: 20 });
  }

  function onPressOut() {
    scale.value = withSpring(1, { damping: 20 });
  }

  function onPress() {
    router.push(`/job/${job.id}`);
  }

  async function onSave() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveJob(job.id);
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
          <Ionicons name="flash" size={11} color={colors.urgentFg || "#fff"} />
          <Text style={styles.urgentText}>URGENT HIRING</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: job.logoColor + "22" }]}>
          <Text style={[styles.logoText, { color: job.logoColor }]}>
            {job.logoInitials}
          </Text>
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.titleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.companyRow}>
            <Text style={styles.companyName} numberOfLines={1}>
              {job.company}
            </Text>
            {job.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  Verified
                </Text>
              </View>
            )}
            {job.isTrusted && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Trusted
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.salaryRow}>
        <View style={styles.salaryBadge}>
          <Ionicons name="cash-outline" size={14} color={colors.success} />
          <Text style={styles.salaryText}>{job.salary}</Text>
          {job.isNegotiable && (
            <Text style={styles.negotiable}> · Negotiable</Text>
          )}
        </View>
        {job.isFreshersOk && (
          <View style={styles.fresherBadge}>
            <Text style={styles.fresherText}>Freshers OK</Text>
          </View>
        )}
      </View>

      {!compact && (
        <View style={styles.metaGrid}>
          <MetaChip
            icon="location-outline"
            label={`${job.location} · ${job.distanceKm} km`}
            colors={colors}
          />
          <MetaChip
            icon="briefcase-outline"
            label={job.experience}
            colors={colors}
          />
          <MetaChip
            icon="time-outline"
            label={job.postedTime}
            colors={colors}
          />
          <MetaChip
            icon="people-outline"
            label={`${job.applicants} applied`}
            colors={colors}
          />
        </View>
      )}

      {compact && (
        <View style={styles.compactMeta}>
          <MetaChip
            icon="location-outline"
            label={`${job.location}`}
            colors={colors}
          />
          <MetaChip
            icon="time-outline"
            label={job.postedTime}
            colors={colors}
          />
        </View>
      )}

      {!compact && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.appliedBtn]}
            onPress={() => router.push(`/apply/${job.id}`)}
            disabled={applied}
          >
            <Text style={styles.applyBtnText}>
              {applied ? "Applied" : "Apply Now"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </AnimatedTouchable>
  );
}

function MetaChip({
  icon,
  label,
  colors,
}: {
  icon: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.muted }]}>
      <Ionicons
        name={icon as "location-outline"}
        size={12}
        color={colors.mutedForeground}
      />
      <Text style={[chipStyles.chipText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "System" : "Inter_400Regular",
  },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
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
      letterSpacing: 0.5,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    logoText: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
    },
    headerMeta: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    jobTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flex: 1,
      marginRight: 8,
    },
    saveBtn: {
      padding: 2,
    },
    companyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 3,
      flexWrap: "wrap",
    },
    companyName: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.successFg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: "Inter_600SemiBold",
    },
    salaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    salaryBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    salaryText: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.success,
    },
    negotiable: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    fresherBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    fresherText: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 14,
    },
    compactMeta: {
      flexDirection: "row",
      gap: 6,
      marginTop: 4,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    applyBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 11,
      borderRadius: 14,
      alignItems: "center",
    },
    appliedBtn: {
      backgroundColor: colors.success,
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
      backgroundColor: "#25D36620",
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#25D36640",
    },
    waBtnText: {
      color: "#25D366",
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
    },
  });
}
