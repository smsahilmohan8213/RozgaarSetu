import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
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
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useApp } from "@/context/AppContext";
import { type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";

interface JobCardProps {
  job: Job;
  compact?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function JobCard({ job, compact = false }: JobCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const router = useRouter();
  const { isJobSaved, toggleSaveJob, isJobApplied, requireAuth } = useApp();
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const saved = isJobSaved(job.id);
  const applied = isJobApplied(job.id);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function onPressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.9, { duration: 100 });
  }
  function onPressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 150 });
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
      style={[styles.card, animStyle, job.isTrusted && styles.featuredCard]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      {job.isUrgent && (
        <LinearGradient
          colors={["#EF4444", "#DC2626"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.urgentBanner}
        >
          <Ionicons name="flash" size={12} color="#fff" />
          <Text style={styles.urgentText}>{t("URGENT HIRING")}</Text>
        </LinearGradient>
      )}

      <View style={styles.header}>
        <View style={[styles.logoWrap, { backgroundColor: job.logoColor + "15" }]}>
          {job.logo ? (
            <Image source={job.logo} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={[styles.logoText, { color: job.logoColor }]}>
              {job.logoInitials}
            </Text>
          )}
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.titleRow}>
            <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>
              {job.title}
            </Text>
            <TouchableOpacity onPress={onSave} style={styles.saveBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={saved ? colors.primary : "#94A3B8"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.companyRow}>
            <Text style={[styles.companyName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {job.company}
            </Text>
            {job.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
            )}
            {job.isTrusted && (
              <View style={[styles.badge, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="shield-checkmark" size={12} color="#4F46E5" />
                <Text style={[styles.badgeText, { color: "#4F46E5" }]}>{t("Trusted")}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.salarySection}>
        <View style={[styles.salaryPill, { backgroundColor: "#F0FDF4" }]}>
          <Ionicons name="cash-outline" size={16} color="#059669" />
          <Text style={styles.salaryText}>{job.salary}</Text>
        </View>
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.locationText}>{job.location}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.metaGrid}>
          <MetaChip icon="briefcase-outline" label={job.experience} />
          <MetaChip icon="time-outline" label={job.postedTime} />
          {job.isFreshersOk && (
            <MetaChip icon="school-outline" label={t("Freshers OK")} highlight />
          )}
        </View>
      )}

      {compact && (
        <View style={styles.compactMeta}>
          <Text style={styles.compactMetaText}>{job.postedTime}</Text>
          <Text style={styles.compactMetaDot}>·</Text>
          <Text style={styles.compactMetaText}>{job.distanceKm} km</Text>
        </View>
      )}

      {!compact && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.appliedBtn]}
            onPress={() => requireAuth(() => router.push(`/apply/${job.id}`))}
            disabled={applied}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={applied ? ["#059669", "#047857"] : ["#1D4ED8", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtnGradient}
            >
              <Ionicons name={applied ? "checkmark" : "send"} size={16} color="#fff" />
              <Text style={styles.applyBtnText}>{applied ? t("Applied") : t("Apply Now")}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp} activeOpacity={0.8}>
            <MaterialCommunityIcons name="whatsapp" size={20} color="#16A34A" />
          </TouchableOpacity>
        </View>
      )}
    </AnimatedTouchable>
  );
}

function MetaChip({ icon, label, highlight = false }: { icon: string; label: string; highlight?: boolean }) {
  return (
    <View style={[chipStyles.chip, highlight && chipStyles.chipHighlight]}>
      <Ionicons name={icon as any} size={12} color={highlight ? "#D97706" : "#64748B"} />
      <Text style={[chipStyles.chipText, highlight && chipStyles.textHighlight]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  chipHighlight: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
  },
  chipText: {
    fontSize: 12,
    color: "#475569",
    fontFamily: "Inter_500Medium",
  },
  textHighlight: {
    color: "#D97706",
  }
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.03)",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
    featuredCard: {
      borderColor: "#E0E7FF",
      backgroundColor: "#FAFAFF",
    },
    urgentBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      alignSelf: "flex-start",
      marginBottom: 12,
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
      gap: 14,
      marginBottom: 16,
    },
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.04)",
    },
    logoImage: {
      width: "65%",
      height: "65%",
      borderRadius: 8,
    },
    logoText: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
    },
    headerMeta: { flex: 1, paddingTop: 2 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    jobTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      flex: 1,
      marginRight: 12,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    saveBtn: { padding: 2 },
    companyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    companyName: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    salarySection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
    },
    salaryPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    salaryText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#059669",
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    locationText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: "#64748B",
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    compactMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    compactMetaText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "#94A3B8",
    },
    compactMetaDot: {
      fontSize: 12,
      color: "#CBD5E1",
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    applyBtn: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#1D4ED8",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    appliedBtn: {
      shadowColor: "#059669",
    },
    applyBtnGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
    },
    applyBtnText: {
      color: "#fff",
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
    waBtn: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F0FDF4",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#BBF7D0",
    },
  });
}
