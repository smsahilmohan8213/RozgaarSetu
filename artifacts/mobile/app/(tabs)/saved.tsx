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
import { JOBS } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedJobIds, appliedJobIds, user } = useApp();
  const isWeb = Platform.OS === "web";

  const savedJobs = JOBS.filter((j) => savedJobIds.includes(j.id));
  const appliedJobs = JOBS.filter((j) => appliedJobIds.includes(j.id));

  const styles = getStyles(colors);

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.guestCenter}>
          <Ionicons name="bookmark" size={60} color={colors.mutedForeground} />
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>
            Save Jobs You Like
          </Text>
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Sign in to save jobs and track your applications
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Saved & Applied</Text>
      </View>

      <FlatList
        data={[...savedJobs]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 100 : 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {appliedJobs.length > 0 && (
              <View style={styles.appliedSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Applied Jobs ({appliedJobs.length})
                  </Text>
                </View>
                {appliedJobs.map((job) => (
                  <View key={job.id} style={[styles.appliedBadge]}>
                    <View style={[styles.appliedIndicator, { backgroundColor: colors.successFg }]}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[styles.appliedText, { color: colors.success }]}>
                        Applied
                      </Text>
                    </View>
                    <JobCard job={job} />
                  </View>
                ))}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Ionicons name="bookmark" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Saved Jobs ({savedJobs.length})
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No saved jobs yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the bookmark on any job to save it here
            </Text>
          </View>
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    guestCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
    guestTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
    guestText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
    signInBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    signInBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    title: { fontSize: 24, fontFamily: "Inter_700Bold" },
    list: { paddingHorizontal: 16, paddingTop: 16 },
    appliedSection: { marginBottom: 8 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
    appliedBadge: { marginBottom: -4 },
    appliedIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-end",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 4,
    },
    appliedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    divider: { height: 1, marginVertical: 16 },
    empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  });
}
