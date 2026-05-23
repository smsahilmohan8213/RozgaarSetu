import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, savedJobIds, appliedJobIds, postedJobs, deletePostedJob } = useApp();
  const isWeb = Platform.OS === "web";

  async function handleLogout() {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Log out of RozgaarSetu?");
      if (confirmed) await logout();
      return;
    }
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout() },
    ]);
  }

  function handleDeleteJob(jobId: string, title: string) {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Delete "${title}"?`);
      if (confirmed) deletePostedJob(jobId);
      return;
    }
    Alert.alert("Delete Job", `Remove "${title}" from listings?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePostedJob(jobId) },
    ]);
  }

  const styles = getStyles(colors);

  if (!user.isAuthenticated) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: isWeb ? 67 : insets.top },
        ]}
      >
        <View style={styles.guestCenter}>
          <View style={[styles.guestAvatar, { backgroundColor: colors.muted }]}>
            <Ionicons name="person" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>
            Create Your Profile
          </Text>
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Get matched with jobs based on your skills and experience
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.signInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isEmployer = user.role === "employer";
  const score = user.profileScore;
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: isWeb ? 100 : 100, paddingTop: isWeb ? 67 : insets.top + 8 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>
          +91 {user.phone}
        </Text>
        <View style={[styles.rolePill, { backgroundColor: isEmployer ? colors.primary + "18" : colors.accent }]}>
          <Ionicons
            name={isEmployer ? "business-outline" : "briefcase-outline"}
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {isEmployer ? "Employer" : "Job Seeker"}
          </Text>
        </View>

        {!isEmployer && (
          <View style={styles.scoreSection}>
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreLabel, { color: colors.foreground }]}>Profile Strength</Text>
              <Text style={[styles.scorePercent, { color: colors.primary }]}>{score}%</Text>
            </View>
            <View style={[styles.scoreBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.scoreFill,
                  {
                    width: `${score}%` as "100%",
                    backgroundColor: score >= 80 ? colors.success : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scoreHint, { color: colors.mutedForeground }]}>
              Add skills & education to improve your profile
            </Text>
          </View>
        )}
      </View>

      {isEmployer ? (
        <>
          <View style={styles.statsRow}>
            <StatCard value={postedJobs.length} label="Posted" icon="add-circle-outline" colors={colors} />
            <StatCard
              value={postedJobs.reduce((s, j) => s + j.applicants, 0)}
              label="Applicants"
              icon="people-outline"
              colors={colors}
            />
            <StatCard
              value={postedJobs.filter((j) => j.isUrgent).length}
              label="Urgent"
              icon="flash-outline"
              colors={colors}
            />
          </View>

          <TouchableOpacity
            style={[styles.postJobBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/post-job")}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.postJobBtnText}>Post a New Job</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            My Job Listings
          </Text>

          {postedJobs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="briefcase-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs posted yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Tap "Post a New Job" above to find your next hire
              </Text>
            </View>
          ) : (
            <View style={[styles.postedList, { borderColor: colors.border }]}>
              {postedJobs.map((job, idx) => (
                <View
                  key={job.id}
                  style={[
                    styles.postedRow,
                    { borderColor: colors.border },
                    idx < postedJobs.length - 1 && { borderBottomWidth: 1 },
                  ]}
                >
                  <View
                    style={[styles.postedLogo, { backgroundColor: job.logoColor + "22" }]}
                  >
                    <Text style={[styles.postedLogoText, { color: job.logoColor }]}>
                      {job.logoInitials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.postedTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[styles.postedMeta, { color: colors.mutedForeground }]}>
                      {job.location} · {job.salary}
                    </Text>
                    <View style={styles.postedBadges}>
                      {job.isUrgent && (
                        <View style={[styles.urgentBadge, { backgroundColor: colors.urgent + "18" }]}>
                          <Text style={[styles.urgentText, { color: colors.urgent }]}>Urgent</Text>
                        </View>
                      )}
                      <Text style={[styles.postedTime, { color: colors.mutedForeground }]}>
                        {job.postedTime}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteJob(job.id, job.title)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard value={appliedJobIds.length} label="Applied" icon="paper-plane-outline" colors={colors} />
            <StatCard value={savedJobIds.length} label="Saved" icon="bookmark-outline" colors={colors} />
            <StatCard value={12} label="Matches" icon="star-outline" colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Profile Details</Text>

          <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <DetailRow icon="location-outline" label="Preferred Location" value={user.location} colors={colors} />
            <DetailRow icon="school-outline" label="Education" value={user.education} colors={colors} />
            <DetailRow icon="briefcase-outline" label="Experience" value={user.experience} colors={colors} />
            <DetailRow
              icon="code-slash-outline"
              label="Skills"
              value={user.skills.length > 0 ? user.skills.join(", ") : "Add your skills"}
              colors={colors}
              last
            />
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="notifications-outline" label="Job Alerts" colors={colors} />
        <MenuItem icon="language-outline" label="Language: English" colors={colors} />
        <MenuItem icon="shield-outline" label="Privacy & Safety" colors={colors} />
        <MenuItem icon="help-circle-outline" label="Help & Support" colors={colors} last />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  value,
  label,
  icon,
  colors,
}: {
  value: number;
  label: string;
  icon: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon as "star-outline"} size={22} color={colors.primary} />
      <Text style={[statStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

function DetailRow({
  icon,
  label,
  value,
  colors,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon as "location-outline"} size={18} color={colors.mutedForeground} />
      <View style={detailStyles.text}>
        <Text style={[detailStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  text: { flex: 1 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  value: { fontSize: 14, fontFamily: "Inter_500Medium" },
});

function MenuItem({
  icon,
  label,
  colors,
  last,
}: {
  icon: string;
  label: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        menuStyles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Ionicons name={icon as "notifications-outline"} size={20} color={colors.mutedForeground} />
      <Text style={[menuStyles.label, { color: colors.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  label: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    guestCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
    guestAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
    guestTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
    guestText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
    signInBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    signInBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
    scroll: { paddingHorizontal: 16 },
    profileCard: {
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
    profileName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
    profilePhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
    rolePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 16,
    },
    roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    scoreSection: { width: "100%" },
    scoreHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    scoreLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    scorePercent: { fontSize: 13, fontFamily: "Inter_700Bold" },
    scoreBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
    scoreFill: { height: "100%", borderRadius: 3 },
    scoreHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 10, marginTop: 4 },
    detailsCard: { borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1 },
    menuCard: { borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1 },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 20,
    },
    logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    postJobBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 16,
      marginBottom: 20,
    },
    postJobBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyCard: {
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      paddingVertical: 36,
      gap: 10,
      marginBottom: 20,
    },
    emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24 },
    postedList: { borderRadius: 16, borderWidth: 1, backgroundColor: colors.card, marginBottom: 20, overflow: "hidden" },
    postedRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    postedLogo: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    postedLogoText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    postedTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    postedMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
    postedBadges: { flexDirection: "row", alignItems: "center", gap: 8 },
    urgentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    urgentText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    postedTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
    deleteBtn: { padding: 4 },
  });
}
