import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { ApplicantStatus } from "@/data/applicants";

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { postedJobs, applications, updateMockApplicationStatus, scheduleInterview } = useApp();

  const job = postedJobs.find(j => j.id === id);

  const applicants = useMemo(() => {
    return applications.filter(a => a.jobId === id);
  }, [applications, id]);

  const [tab, setTab] = useState<"All" | "Shortlisted" | "Rejected" | "Interview">("All");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const displayApplicants = useMemo(() => {
    return applicants.filter(a => {
      if (tab === "All") return true;
      if (tab === "Interview") return a.status === "interview";
      return a.status.toLowerCase() === tab.toLowerCase();
    });
  }, [applicants, tab]);

  const upcomingDates = useMemo(() => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const timeSlots = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];

  function handleStatusChange(appId: string, newStatus: ApplicantStatus) {
    updateMockApplicationStatus(appId, newStatus);
  }

  function openScheduleModal(appId: string) {
    setSelectedAppId(appId);
    setSelectedDate(upcomingDates[0].toISOString());
    setSelectedTime(timeSlots[0]);
    setIsModalVisible(true);
  }

  function confirmSchedule() {
    if (selectedAppId && selectedDate && selectedTime) {
      scheduleInterview(selectedAppId, new Date(selectedDate).toLocaleDateString(), selectedTime);
      setIsModalVisible(false);
      setSelectedAppId(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Applicants</Text>
            {job && <Text style={styles.subtitle} numberOfLines={1}>{job.title}</Text>}
          </View>
        </View>

        <View style={styles.tabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["All", "Shortlisted", "Interview", "Rejected"] as const).map(t => (
              <TouchableOpacity 
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={displayApplicants}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="people-outline" size={50} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Applicants Yet</Text>
            <Text style={styles.emptyText}>
              {tab === "All" 
                ? "You haven't received any applications for this job yet." 
                : `You have no ${tab.toLowerCase()} applicants.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.experience} Exp</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                item.status === "shortlisted" || item.status === "interview" ? { backgroundColor: "#D1FAE5" } :
                item.status === "rejected" ? { backgroundColor: "#FEE2E2" } : { backgroundColor: "#F1F5F9" }
              ]}>
                <Text style={[
                  styles.statusText,
                  item.status === "shortlisted" || item.status === "interview" ? { color: "#059669" } :
                  item.status === "rejected" ? { color: "#DC2626" } : { color: "#64748B" }
                ]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.skillsRow}>
              {item.skills.map(s => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text style={styles.dateText}>Applied: {new Date(item.appliedDate).toLocaleDateString()}</Text>
            </View>

            <View style={styles.actions}>
              
              {item.status === "applied" && (
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: "#2563EB" }]}
                  onPress={() => handleStatusChange(item.id, "shortlisted")}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.btnActionText}>Shortlist</Text>
                </TouchableOpacity>
              )}

              {item.status === "shortlisted" && (
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: "#059669" }]}
                  onPress={() => openScheduleModal(item.id)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={styles.btnActionText}>Schedule</Text>
                </TouchableOpacity>
              )}
              
              {item.status !== "rejected" && item.status !== "interview" && (
                <TouchableOpacity 
                  style={[styles.btnAction, { backgroundColor: "#FEE2E2" }]}
                  onPress={() => handleStatusChange(item.id, "rejected")}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                  <Text style={[styles.btnActionText, { color: "#DC2626" }]}>Reject</Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
        )}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Interview</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {upcomingDates.map((d, i) => {
                const isSelected = selectedDate === d.toISOString();
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => setSelectedDate(d.toISOString())}
                  >
                    <Text style={[styles.dateChipDay, isSelected && styles.dateChipDayActive]}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                    <Text style={[styles.dateChipDate, isSelected && styles.dateChipDateActive]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.modalLabel}>Select Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity 
                    key={time} 
                    style={[styles.timeChip, isSelected && styles.timeChipActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmSchedule}>
              <Text style={styles.confirmBtnText}>Confirm Interview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563EB",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#2563EB",
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1E3A8A",
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
  },
  metaDot: {
    marginHorizontal: 6,
    color: "#94A3B8",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#475569",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  btnAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  modalLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#334155",
    marginTop: 16,
    marginBottom: 12,
  },
  dateScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  dateChip: {
    width: 64,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#fff",
  },
  dateChipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EEF2FF",
  },
  dateChipDay: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
    marginBottom: 4,
  },
  dateChipDayActive: {
    color: "#2563EB",
  },
  dateChipDate: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  dateChipDateActive: {
    color: "#1D4ED8",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  timeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  timeChipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  timeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#475569",
  },
  timeTextActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
