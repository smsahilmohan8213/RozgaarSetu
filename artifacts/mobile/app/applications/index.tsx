import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

export default function MyApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { applications, postedJobs, user } = useApp();

  const [filter, setFilter] = useState<"All" | "Applied" | "Reviewed" | "Shortlisted" | "Rejected">("All");

  const myApplications = useMemo(() => {
    return applications
      .filter(a => a.applicant_id === user.id) // filter by authenticated applicant identity
      .filter(a => filter === "All" || a.status.toLowerCase() === filter.toLowerCase());
  }, [applications, filter, user]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>My Applications</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          data={["All", "Applied", "Reviewed", "Shortlisted", "Rejected"]}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item as any)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={myApplications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="document-text-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Applications</Text>
            <Text style={styles.emptyText}>
              {filter === "All" ? "You haven't applied to any jobs yet." : `You have no ${filter.toLowerCase()} applications.`}
            </Text>
            {filter === "All" && (
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)/jobs")}>
                <Text style={styles.browseBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const job = postedJobs.find(j => j.id === item.jobId);
          return (
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(`/applications/${item.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{job?.title || "Job Title"}</Text>
                  <Text style={styles.company}>{job?.company || "Company"}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  item.status === "shortlisted" || item.status === "interview" ? { backgroundColor: "#D1FAE5" } :
                  item.status === "rejected" ? { backgroundColor: "#FEE2E2" } :
                  item.status === "reviewed" ? { backgroundColor: "#FEF08A" } : { backgroundColor: "#F1F5F9" }
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.status === "shortlisted" || item.status === "interview" ? { color: "#059669" } :
                    item.status === "rejected" ? { color: "#DC2626" } :
                    item.status === "reviewed" ? { color: "#854D0E" } : { color: "#475569" }
                  ]}>
                    {item.status === "interview" ? "Interviewing" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={styles.dateText}>Applied: {new Date(item.appliedDate).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTop: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { marginRight: 16 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0F172A" },
  filterScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "transparent" },
  filterChipActive: { backgroundColor: "#EEF2FF", borderColor: "#2563EB" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#475569" },
  filterTextActive: { color: "#2563EB", fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#94A3B8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  jobInfo: { flex: 1, marginRight: 12 },
  jobTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 4 },
  company: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },
  emptyCenter: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center" },
  browseBtn: { marginTop: 12, backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  browseBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
