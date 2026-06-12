import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedJobIds, appliedJobIds, user, postedJobs } = useApp();
  const isWeb = Platform.OS === "web";

  const allJobs = postedJobs;
  const savedJobs = allJobs.filter((j) => savedJobIds.includes(j.id));
  const appliedJobs = allJobs.filter((j) => appliedJobIds.includes(j.id));

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.guestCenter}>
          <View style={styles.guestIconWrap}>
            <Ionicons name="bookmark" size={40} color="#2563EB" />
          </View>
          <Text style={styles.guestTitle}>Save Jobs You Like</Text>
          <Text style={styles.guestText}>Sign in to save jobs and track your applications</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>Saved & Applied</Text>
      </View>

      <FlatList
        data={savedJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {appliedJobs.length > 0 && (
              <View style={styles.appliedSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  </View>
                  <Text style={styles.sectionTitle}>Applied Jobs ({appliedJobs.length})</Text>
                </View>
                {appliedJobs.map((job) => (
                  <View key={job.id}>
                    <View style={styles.appliedIndicator}>
                      <Ionicons name="checkmark-circle" size={13} color="#059669" />
                      <Text style={styles.appliedText}>Applied</Text>
                    </View>
                    <JobCard job={job} />
                  </View>
                ))}
                <View style={styles.divider} />
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="bookmark" size={16} color="#2563EB" />
              </View>
              <Text style={styles.sectionTitle}>Saved Jobs ({savedJobs.length})</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No saved jobs yet</Text>
            <Text style={styles.emptyText}>Tap the bookmark on any job to save it here</Text>
          </View>
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  guestCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  guestIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0F172A", textAlign: "center" },
  guestText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center" },
  signInBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16, marginTop: 4, backgroundColor: "#2563EB" },
  signInBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#3B5BDB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0F172A" },
  list: { paddingHorizontal: 16, paddingTop: 16 },
  appliedSection: { marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0F172A" },
  appliedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    marginBottom: 4,
  },
  appliedText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#059669" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center" },
});
