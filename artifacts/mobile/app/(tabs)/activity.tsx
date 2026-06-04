import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { useApp } from "@/context/AppContext";
import { JOBS } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

type Tab = "saved" | "applied";

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedJobIds, appliedJobIds, jobStatuses, user, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";
  const [activeTab, setActiveTab] = useState<Tab>("saved");

  const allJobs = [...postedJobs, ...JOBS];
  const savedJobs = allJobs.filter((j) => savedJobIds.includes(j.id));
  const appliedJobs = allJobs.filter((j) => appliedJobIds.includes(j.id));

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.guestCenter}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="notifications" size={40} color="#2563EB" />
          </View>
          <Text style={styles.guestTitle}>Track Your Activity</Text>
          <Text style={styles.guestText}>Sign in to save jobs and track applications</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "shortlisted":
        return "#059669";
      case "rejected":
        return "#DC2626";
      case "viewed":
        return "#2563EB";
      default:
        return "#94A3B8";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "shortlisted":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "viewed":
        return "eye";
      default:
        return "hourglass";
    }
  };

  const renderJobItem = ({ item }: { item: any }) => {
    const status = jobStatuses?.[item.id];
    return (
      <View>
        <JobCard job={item} />
        {status && activeTab === "applied" && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + "15", borderLeftColor: getStatusColor(status) }]}>
            <Ionicons name={getStatusIcon(status) as any} size={14} color={getStatusColor(status)} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>Activity</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "saved" && styles.tabActive]}
          onPress={() => setActiveTab("saved")}
        >
          <Ionicons
            name={activeTab === "saved" ? "bookmark" : "bookmark-outline"}
            size={16}
            color={activeTab === "saved" ? colors.primary : "#94A3B8"}
          />
          <Text style={[styles.tabText, activeTab === "saved" && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            Saved ({savedJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "applied" && styles.tabActive]}
          onPress={() => setActiveTab("applied")}
        >
          <Ionicons
            name={activeTab === "applied" ? "checkmark-done" : "checkmark-done-outline"}
            size={16}
            color={activeTab === "applied" ? colors.primary : "#94A3B8"}
          />
          <Text style={[styles.tabText, activeTab === "applied" && { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            Applied ({appliedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "saved" ? (
        savedJobs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Saved Jobs</Text>
            <Text style={styles.emptyText}>Save jobs to find them quickly later</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/(tabs)/jobs")}>
              <Text style={styles.emptyBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={savedJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : appliedJobs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-outline" size={44} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Applications</Text>
          <Text style={styles.emptyText}>Apply to jobs to track your progress</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={styles.emptyBtnText}>Find Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appliedJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563EB",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  guestCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  guestIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    marginTop: 16,
    textAlign: "center",
  },
  guestText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  signInBtn: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#2563EB",
    borderRadius: 12,
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: "#F8FAFF",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
