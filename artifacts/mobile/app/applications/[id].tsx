import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { applications, postedJobs } = useApp();

  const application = applications.find(a => a.id === id);
  const job = postedJobs.find(j => j.id === application?.jobId);

  if (!application || !job) {
    return (
      <View style={styles.center}>
        <Text>Application not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#2563EB" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const steps = [
    { id: "applied", label: "Application Sent", date: application.appliedDate, completed: true },
    { 
      id: "reviewed", 
      label: "Application Reviewed", 
      date: application.status !== "applied" ? application.appliedDate : null, 
      completed: application.status !== "applied" 
    },
    { 
      id: "shortlisted", 
      label: "Shortlisted", 
      date: application.status === "shortlisted" || application.status === "interview" ? application.appliedDate : null, 
      completed: application.status === "shortlisted" || application.status === "interview",
      rejected: application.status === "rejected"
    },
    { 
      id: "interview", 
      label: "Interview Scheduled", 
      date: application.status === "interview" ? `${application.interviewDate} at ${application.interviewTime}` : null, 
      completed: application.status === "interview" 
    }
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Application Tracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View style={[styles.logoWrap, { backgroundColor: job.logoColor + "18" }]}>
              <Text style={[styles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
            </View>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{job.salary}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <View style={styles.timeline}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepLineCol}>
                    <View style={[
                      styles.stepDot, 
                      step.completed ? styles.stepDotActive : styles.stepDotInactive,
                      step.rejected && styles.stepDotRejected
                    ]}>
                      {step.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                      {step.rejected && <Ionicons name="close" size={12} color="#fff" />}
                    </View>
                    {!isLast && <View style={[styles.stepLine, step.completed ? styles.stepLineActive : styles.stepLineInactive]} />}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[
                      styles.stepLabel, 
                      step.completed ? styles.stepLabelActive : styles.stepLabelInactive,
                      step.rejected && styles.stepLabelRejected
                    ]}>
                      {step.rejected && step.id === "shortlisted" ? "Application Rejected" : step.label}
                    </Text>
                    {step.date && <Text style={styles.stepDate}>
                      {step.id === "interview" ? step.date : new Date(step.date).toLocaleDateString()}
                    </Text>}
                    
                    {step.id === "interview" && step.completed && (
                      <View style={styles.interviewBox}>
                        <Ionicons name="videocam-outline" size={20} color="#2563EB" />
                        <View style={styles.interviewInfo}>
                          <Text style={styles.interviewTitle}>Video Interview</Text>
                          <Text style={styles.interviewSubtitle}>Link will be shared by employer</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {application.status === "rejected" && (
           <View style={styles.rejectedBox}>
             <Ionicons name="information-circle-outline" size={20} color="#DC2626" />
             <Text style={styles.rejectedText}>
               Don't give up! Keep exploring other jobs matching your profile.
             </Text>
           </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  backBtn: { marginRight: 16 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#0F172A" },
  scroll: { padding: 16, paddingBottom: 100 },
  jobCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#94A3B8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  jobHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  logoWrap: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  logoText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 4 },
  company: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#64748B" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#475569" },
  timelineCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#94A3B8", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  timelineTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 20 },
  timeline: { paddingLeft: 8 },
  stepRow: { flexDirection: "row" },
  stepLineCol: { alignItems: "center", width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", zIndex: 2 },
  stepDotActive: { backgroundColor: "#059669" },
  stepDotInactive: { backgroundColor: "#E2E8F0" },
  stepDotRejected: { backgroundColor: "#DC2626" },
  stepLine: { width: 2, flex: 1, minHeight: 40, marginVertical: -2, zIndex: 1 },
  stepLineActive: { backgroundColor: "#059669" },
  stepLineInactive: { backgroundColor: "#E2E8F0" },
  stepContent: { flex: 1, paddingLeft: 16, paddingBottom: 30 },
  stepLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  stepLabelActive: { color: "#0F172A" },
  stepLabelInactive: { color: "#94A3B8" },
  stepLabelRejected: { color: "#DC2626" },
  stepDate: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B" },
  interviewBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginTop: 12, gap: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  interviewInfo: { flex: 1 },
  interviewTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1E3A8A", marginBottom: 2 },
  interviewSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3B82F6" },
  rejectedBox: { flexDirection: "row", gap: 12, backgroundColor: "#FEF2F2", padding: 16, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: "#FECACA" },
  rejectedText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#991B1B", lineHeight: 20 },
});
