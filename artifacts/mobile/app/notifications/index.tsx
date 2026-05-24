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

import { useApp } from "@/context/AppContext";
import { JOBS } from "@/data/jobs";

type NotifType = "job_alert" | "application" | "employer" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  jobId?: string;
}

function generateNotifications(appliedIds: string[], savedIds: string[]): Notification[] {
  const base: Notification[] = [
    {
      id: "n1",
      type: "job_alert",
      title: "5 new jobs near you in Rohini",
      body: "Delivery Executive, Office Assistant, Telecaller and more jobs were posted in the last 2 hours.",
      time: "15 min ago",
      read: false,
    },
    {
      id: "n2",
      type: "system",
      title: "Welcome to RozgaarSetu!",
      body: "India's fastest hyperlocal job platform. Complete your profile to get better matches.",
      time: "Just now",
      read: false,
    },
    {
      id: "n3",
      type: "job_alert",
      title: "Urgent hiring: 3 jobs in Pitampura",
      body: "Employers in Pitampura are urgently hiring. Apply now before positions are filled.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "n4",
      type: "system",
      title: "Profile incomplete",
      body: "Add your skills and education to improve your profile score and get more matches.",
      time: "2 hours ago",
      read: true,
    },
    {
      id: "n5",
      type: "job_alert",
      title: "New delivery jobs available",
      body: "Zomato, Swiggy, and Blinkit are hiring in your area. Earn ₹20,000–₹40,000/month.",
      time: "3 hours ago",
      read: true,
    },
    {
      id: "n6",
      type: "system",
      title: "RozgaarSetu tip",
      body: "Jobs posted today are 3x more likely to respond. Check the latest listings!",
      time: "5 hours ago",
      read: true,
    },
  ];

  const appNotifs: Notification[] = appliedIds.slice(0, 2).map((jobId, i) => {
    const job = JOBS.find((j) => j.id === jobId);
    return {
      id: `app_${jobId}`,
      type: "application" as NotifType,
      title: "Application under review",
      body: job
        ? `Your application for ${job.title} at ${job.company} has been received. Employer will respond within 1–3 days.`
        : "Your application has been received.",
      time: i === 0 ? "30 min ago" : "2 hours ago",
      read: false,
      jobId,
    };
  });

  const savedNotifs: Notification[] = savedIds.slice(0, 1).map((jobId) => {
    const job = JOBS.find((j) => j.id === jobId);
    return {
      id: `saved_${jobId}`,
      type: "employer" as NotifType,
      title: "Saved job expiring soon",
      body: job
        ? `${job.company} is still hiring for ${job.title}. Don't wait — apply before the position is filled!`
        : "One of your saved jobs may close soon.",
      time: "4 hours ago",
      read: true,
      jobId,
    };
  });

  return [...appNotifs, ...base.slice(0, 3), ...savedNotifs, ...base.slice(3)];
}

const TYPE_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  job_alert: { icon: "briefcase", color: "#2563EB", bg: "#DBEAFE" },
  application: { icon: "paper-plane", color: "#059669", bg: "#D1FAE5" },
  employer: { icon: "business", color: "#D97706", bg: "#FEF3C7" },
  system: { icon: "information-circle", color: "#7C3AED", bg: "#EDE9FE" },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appliedJobIds, savedJobIds } = useApp();
  const isWeb = Platform.OS === "web";

  const [notifications, setNotifications] = useState<Notification[]>(() =>
    generateNotifications(appliedJobIds, savedJobIds)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function handlePress(notif: Notification) {
    markRead(notif.id);
    if (notif.jobId) {
      router.push(`/job/${notif.jobId}`);
    }
  }

  const renderItem = ({ item }: { item: Notification }) => {
    const meta = TYPE_META[item.type];
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as "briefcase"} size={20} color={meta.color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={styles.dot} />}
          </View>
          <Text style={styles.itemText} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 40 : insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          unreadCount === 0 ? (
            <View style={styles.allReadBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.allReadText}>All caught up!</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              We'll notify you about new jobs, application updates, and employer responses.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#3B5BDB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#0F172A" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#2563EB" },
  markAllBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#2563EB" },
  list: { paddingTop: 8 },
  allReadBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
  },
  allReadText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#059669" },
  item: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  itemUnread: { backgroundColor: "#F0F5FF" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },
  itemText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 6,
  },
  itemTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  separator: { height: 1, backgroundColor: "#F1F5F9" },
  empty: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
});
