import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { MOCK_NOTIFICATIONS, AppNotification, NotificationCategory } from "@/data/notifications";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const { user } = useApp();

  const isEmployer = user.role === "employer";

  const notifications = useMemo(() => {
    return MOCK_NOTIFICATIONS.filter(n => 
      isEmployer ? n.isEmployerNotification : !n.isEmployerNotification
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [isEmployer]);

  const [filter, setFilter] = useState<NotificationCategory | "all">("all");

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter(n => n.category === filter);
  }, [filter, notifications]);

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "job_matches": return "search";
      case "applications": return "document-text";
      case "profile_updates": return "person";
      case "employer_updates": return "briefcase";
      default: return "notifications";
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case "job_matches": return "#059669";
      case "applications": return "#2563EB";
      case "profile_updates": return "#D97706";
      case "employer_updates": return "#7C3AED";
      default: return "#64748B";
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diff = new Date().getTime() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours || 1}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!user.isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: isWeb ? 67 : insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>{t("Notifications")}</Text>
        </View>
        <View style={styles.guestCenter}>
          <Ionicons name="notifications-off-outline" size={60} color="#94A3B8" />
          <Text style={styles.guestTitle}>{t("Sign in to view notifications")}</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/auth")}>
            <Text style={styles.signInBtnText}>{t("Sign In")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("Notifications")}</Text>
      </View>

      <View style={styles.filterTabs}>
        {(["all", "job_matches", "applications", "profile_updates"] as const).map(cat => {
           if (isEmployer && cat === "job_matches") return null;
           if (isEmployer && cat === "applications") return null;
           const label = cat === "all" ? t("All") : 
                         cat === "job_matches" ? t("Job Matches") : 
                         cat === "applications" ? t("Applications") : 
                         t("Profile");
           
           return (
             <TouchableOpacity 
               key={cat} 
               style={[styles.filterChip, filter === cat && styles.filterChipActive]}
               onPress={() => setFilter(cat)}
             >
               <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{label}</Text>
             </TouchableOpacity>
           );
        })}
        {isEmployer && (
          <TouchableOpacity 
            style={[styles.filterChip, filter === "employer_updates" && styles.filterChipActive]}
            onPress={() => setFilter("employer_updates")}
          >
            <Text style={[styles.filterText, filter === "employer_updates" && styles.filterTextActive]}>{t("Employer Updates")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="notifications-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t("No notifications yet")}</Text>
            <Text style={styles.emptyText}>{t("We'll let you know when something important happens.")}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = getCategoryColor(item.category);
          return (
            <TouchableOpacity style={[styles.notifCard, !item.isRead && styles.notifCardUnread]} activeOpacity={0.8}>
              {!item.isRead && <View style={styles.unreadDot} />}
              <View style={[styles.iconWrap, { backgroundColor: color + "15" }]}>
                <Ionicons name={getCategoryIcon(item.category) as any} size={20} color={color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>{t(item.title)}</Text>
                <Text style={styles.notifBody}>{t(item.body)}</Text>
                <Text style={styles.notifTime}>{formatTimeAgo(item.timestamp)}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0F172A" },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  list: { padding: 16, paddingBottom: 100 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  notifCardUnread: {
    backgroundColor: "#F0FDF4", // slight tint for unread
    borderColor: "#BBF7D0",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
    marginBottom: 4,
  },
  notifTitleUnread: {
    color: "#0F172A",
    fontFamily: "Inter_700Bold",
  },
  notifBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginBottom: 8,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  guestCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    textAlign: "center",
  },
  signInBtn: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  signInBtnText: {
    color: "#ffffff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
