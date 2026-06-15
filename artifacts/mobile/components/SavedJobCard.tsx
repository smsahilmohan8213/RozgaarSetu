import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { type Job } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

interface SavedJobCardProps {
  job: Job;
  savedDateStr?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function SavedJobCard({ job, savedDateStr = "Saved recently" }: SavedJobCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { toggleSaveJob, requireAuth, isJobApplied } = useApp();
  const scale = useSharedValue(1);
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

  function onRemove() {
    requireAuth(() => {
      toggleSaveJob(job.id);
    });
  }

  function onApply() {
    requireAuth(() => {
      router.push(`/apply/${job.id}`);
    });
  }

  return (
    <AnimatedTouchable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName} numberOfLines={1}>
            {job.company}
          </Text>
          <Text style={styles.savedDate}>{savedDateStr}</Text>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.logoWrap}>
          <View style={[styles.logo, { backgroundColor: job.logoColor + "18" }]}>
            <Text style={[styles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
          </View>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color="#059669" />
              <Text style={[styles.metaText, { color: "#059669", fontFamily: "Inter_600SemiBold" }]}>{job.salary}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.applyBtn, applied && { backgroundColor: "#059669" }]}
        onPress={onApply}
        disabled={applied}
        activeOpacity={0.85}
      >
        <Text style={styles.applyBtnText}>{applied ? "Applied" : "Apply Now"}</Text>
        <Ionicons name={applied ? "checkmark" : "arrow-forward"} size={16} color="#fff" />
      </TouchableOpacity>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#3B5BDB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFF",
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    marginBottom: 2,
  },
  savedDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
  },
  removeBtn: {
    padding: 4,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  logoWrap: {
    justifyContent: "center",
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
