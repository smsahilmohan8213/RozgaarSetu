import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { JOBS } from "@/data/jobs";

interface PendingEmployer {
  id: string;
  name: string;
  company: string;
  phone: string;
  location: string;
  requestedAt: string;
  jobsPosted: number;
}

interface ReportedJob {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  reason: string;
  reportedAt: string;
  reportCount: number;
}

const PENDING_EMPLOYERS: PendingEmployer[] = [
  { id: "pe1", name: "Rajesh Gupta", company: "Gupta Steel Works", phone: "9812345678", location: "Rohini", requestedAt: "2 hours ago", jobsPosted: 3 },
  { id: "pe2", name: "Sunita Sharma", company: "Sharma Beauty Parlour", phone: "9988776655", location: "Pitampura", requestedAt: "5 hours ago", jobsPosted: 1 },
  { id: "pe3", name: "Mohammad Arif", company: "Arif Transport Co", phone: "9712345678", location: "Jahangirpuri", requestedAt: "1 day ago", jobsPosted: 5 },
  { id: "pe4", name: "Priya Kapoor", company: "Kapoor Coaching Centre", phone: "9845612378", location: "Mukherjee Nagar", requestedAt: "2 days ago", jobsPosted: 2 },
];

const REPORTED_JOBS: ReportedJob[] = [
  { id: "rj1", jobId: "r_fake_1", jobTitle: "Work from Home — Earn ₹5000/day", company: "Mystery Corp", reason: "Fake job / Scam", reportedAt: "1 hour ago", reportCount: 14 },
  { id: "rj2", jobId: "r_fake_2", jobTitle: "Data Entry — No experience ₹80k/month", company: "Online Earners", reason: "Misleading salary", reportedAt: "3 hours ago", reportCount: 7 },
  { id: "rj3", jobId: "r_fake_3", jobTitle: "Part Time Online Work", company: "Quick Cash India", reason: "MLM / pyramid scheme", reportedAt: "6 hours ago", reportCount: 22 },
];

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { postedJobs, applications, user } = useApp();

  const [pendingList, setPendingList] = useState(PENDING_EMPLOYERS);
  const [reportedList, setReportedList] = useState(REPORTED_JOBS);
  const [activeTab, setActiveTab] = useState<"overview" | "verify" | "reports" | "jobs">("overview");

  const totalJobs = JOBS.length + postedJobs.length;
  const urgentJobs = [...JOBS, ...postedJobs].filter((j) => j.isUrgent).length;
  const verifiedJobs = JOBS.filter((j) => j.isVerified).length;

  function handleVerify(id: string, name: string) {
    const action = () => setPendingList((prev) => prev.filter((e) => e.id !== id));
    if (Platform.OS === "web") {
      if (window.confirm(`Verify employer: ${name}?`)) action();
      return;
    }
    Alert.alert("Verify Employer", `Grant verified badge to ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Verify", style: "default", onPress: action },
    ]);
  }

  function handleReject(id: string, name: string) {
    const action = () => setPendingList((prev) => prev.filter((e) => e.id !== id));
    if (Platform.OS === "web") {
      if (window.confirm(`Reject verification for ${name}?`)) action();
      return;
    }
    Alert.alert("Reject", `Reject verification request from ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: action },
    ]);
  }

  function handleRemoveJob(id: string, title: string) {
    const action = () => setReportedList((prev) => prev.filter((r) => r.id !== id));
    if (Platform.OS === "web") {
      if (window.confirm(`Remove job: "${title}"?`)) action();
      return;
    }
    Alert.alert("Remove Job", `Remove "${title}" from listings?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: action },
    ]);
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "verify", label: "Verify", icon: "shield-checkmark", badge: pendingList.length },
    { key: "reports", label: "Reports", icon: "flag", badge: reportedList.length },
    { key: "jobs", label: "All Jobs", icon: "briefcase" },
  ] as const;

  return (
    // Only allow employers (or future admin roles) to access this screen
    <View style={styles.container}>
      {user.role !== "employer" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="lock-closed" size={48} color="#94A3B8" />
          <Text style={{ fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginTop: 12, marginBottom: 8 }}>
            Employer Access Required
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", marginBottom: 18 }}>
            This section is restricted to employers. Please sign in as an employer to access admin features.
          </Text>
          <TouchableOpacity style={{ backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }} onPress={() => router.push("/auth")}>
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold" }}>Sign in as Employer</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Header */}
      <LinearGradient
        colors={["#1E1B4B", "#312E81", "#4338CA"]}
        style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>RozgaarSetu Control Centre</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield" size={12} color="#fff" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </LinearGradient>

      {/* Warning */}
      <View style={styles.warnBanner}>
        <Ionicons name="warning" size={14} color="#D97706" />
        <Text style={styles.warnText}>Admin access only · Actions are permanent</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={{ position: "relative" }}>
              <Ionicons
                name={tab.icon as "grid"}
                size={18}
                color={activeTab === tab.key ? "#2563EB" : "#94A3B8"}
              />
              {"badge" in tab && (tab as { badge?: number }).badge! > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{(tab as { badge: number }).badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              <StatCard value={totalJobs} label="Total Jobs" icon="briefcase" color="#2563EB" bg="#DBEAFE" />
              <StatCard value={urgentJobs} label="Urgent" icon="flash" color="#DC2626" bg="#FEE2E2" />
              <StatCard value={verifiedJobs} label="Verified" icon="checkmark-circle" color="#059669" bg="#D1FAE5" />
              <StatCard value={pendingList.length} label="Pending" icon="time" color="#D97706" bg="#FEF3C7" />
            </View>

            <SectionTitle title="Platform Health" />
            <View style={styles.card}>
              <HealthRow label="Fake job reports" value={reportedList.length} status="warn" />
              <HealthRow label="Pending verifications" value={pendingList.length} status="info" />
              <HealthRow label="Total active jobs" value={totalJobs} status="good" />
              <HealthRow label="Verified employers" value={verifiedJobs} status="good" last />
            </View>

            <SectionTitle title="Quick Actions" />
            <View style={styles.actionsGrid}>
              <ActionBtn icon="shield-checkmark" label="Verify Employers" color="#059669" onPress={() => setActiveTab("verify")} />
              <ActionBtn icon="flag" label="Review Reports" color="#DC2626" onPress={() => setActiveTab("reports")} />
              <ActionBtn icon="briefcase" label="Browse Jobs" color="#2563EB" onPress={() => setActiveTab("jobs")} />
              <ActionBtn icon="bar-chart" label="Analytics" color="#7C3AED" onPress={() => {}} />
            </View>
          </>
        )}

        {/* VERIFY TAB */}
        {activeTab === "verify" && (
          <>
            <SectionTitle title={`Pending Verifications (${pendingList.length})`} />
            {pendingList.length === 0 ? (
              <EmptyState icon="checkmark-circle" title="All caught up!" text="No pending employer verifications." />
            ) : (
              pendingList.map((emp) => (
                <View key={emp.id} style={styles.card}>
                  <View style={styles.empHeader}>
                    <View style={styles.empAvatar}>
                      <Text style={styles.empAvatarText}>{emp.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.empName}>{emp.name}</Text>
                      <Text style={styles.empCompany}>{emp.company}</Text>
                      <Text style={styles.empMeta}>📍 {emp.location} · {emp.jobsPosted} jobs posted · {emp.requestedAt}</Text>
                    </View>
                  </View>
                  <View style={styles.empPhone}>
                    <Ionicons name="call-outline" size={14} color="#64748B" />
                    <Text style={styles.empPhoneText}>+91 {emp.phone}</Text>
                  </View>
                  <View style={styles.verifyActions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(emp.id, emp.name)}
                    >
                      <Ionicons name="close" size={16} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleVerify(emp.id, emp.name)}
                    >
                      <Ionicons name="shield-checkmark" size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Verify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <>
            <SectionTitle title={`Reported Jobs (${reportedList.length})`} />
            {reportedList.length === 0 ? (
              <EmptyState icon="shield-checkmark" title="No active reports" text="All reported jobs have been reviewed." />
            ) : (
              reportedList.map((rep) => (
                <View key={rep.id} style={[styles.card, styles.reportCard]}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportBadge}>
                      <Ionicons name="flag" size={12} color="#DC2626" />
                      <Text style={styles.reportCount}>{rep.reportCount} reports</Text>
                    </View>
                    <Text style={styles.reportTime}>{rep.reportedAt}</Text>
                  </View>
                  <Text style={styles.reportTitle}>{rep.jobTitle}</Text>
                  <Text style={styles.reportCompany}>{rep.company}</Text>
                  <View style={styles.reasonBadge}>
                    <Text style={styles.reasonText}>⚠️ {rep.reason}</Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity style={styles.ignoreBtn}>
                      <Text style={styles.ignoreBtnText}>Ignore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveJob(rep.id, rep.jobTitle)}
                    >
                      <Ionicons name="trash" size={14} color="#fff" />
                      <Text style={styles.removeBtnText}>Remove Job</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* JOBS TAB */}
        {activeTab === "jobs" && (
          <>
            <SectionTitle title={`All Jobs (${totalJobs})`} />
            {[...JOBS].slice(0, 15).map((job) => (
              <View key={job.id} style={styles.jobRow}>
                <View style={[styles.jobLogo, { backgroundColor: job.logoColor + "18" }]}>
                  <Text style={[styles.jobLogoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobMeta}>{job.company} · {job.location} · {job.salary}</Text>
                  <View style={styles.jobBadges}>
                    {job.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={10} color="#059669" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                    {job.isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    )}
                    <Text style={styles.applicantText}>{job.applicants} applied</Text>
                  </View>
                </View>
              </View>
            ))}
            {totalJobs > 15 && (
              <Text style={styles.moreText}>+ {totalJobs - 15} more jobs in the platform</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, icon, color, bg }: { value: number; label: string; icon: string; color: string; bg: string }) {
  return (
    <View style={[adminStatStyles.card]}>
      <View style={[adminStatStyles.icon, { backgroundColor: bg }]}>
        <Ionicons name={icon as "briefcase"} size={20} color={color} />
      </View>
      <Text style={adminStatStyles.value}>{value}</Text>
      <Text style={adminStatStyles.label}>{label}</Text>
    </View>
  );
}

const adminStatStyles = StyleSheet.create({
  card: { width: "48%", backgroundColor: "#fff", borderRadius: 18, padding: 14, alignItems: "center", gap: 6, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0F172A" },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B" },
});

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function HealthRow({ label, value, status, last }: { label: string; value: number; status: "good" | "warn" | "info"; last?: boolean }) {
  const colors = { good: "#059669", warn: "#D97706", info: "#2563EB" };
  return (
    <View style={[styles.healthRow, !last && styles.healthRowBorder]}>
      <Text style={styles.healthLabel}>{label}</Text>
      <View style={styles.healthRight}>
        <Text style={[styles.healthValue, { color: colors[status] }]}>{value}</Text>
        <View style={[styles.healthDot, { backgroundColor: colors[status] }]} />
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as "briefcase"} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as "briefcase"} size={40} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  adminBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  warnBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, backgroundColor: "#FEF3C7", borderBottomWidth: 1, borderBottomColor: "#FDE68A" },
  warnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#D97706" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 3, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#2563EB" },
  tabLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#94A3B8" },
  tabLabelActive: { color: "#2563EB", fontFamily: "Inter_600SemiBold" },
  tabBadge: { position: "absolute", top: -4, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" },
  tabBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  scroll: { padding: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 12, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  reportCard: { borderLeftWidth: 3, borderLeftColor: "#DC2626" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 10, marginTop: 4 },
  healthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  healthRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  healthLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#475569" },
  healthRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  actionBtn: { width: "48%", backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", gap: 8, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#0F172A", textAlign: "center" },
  empHeader: { flexDirection: "row", gap: 12, marginBottom: 8 },
  empAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  empAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#2563EB" },
  empName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  empCompany: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#475569" },
  empMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8", marginTop: 2 },
  empPhone: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  empPhoneText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B" },
  verifyActions: { flexDirection: "row", gap: 10 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FFF5F5" },
  rejectBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: "#059669" },
  approveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reportBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  reportCount: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#DC2626" },
  reportTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  reportTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginBottom: 2 },
  reportCompany: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", marginBottom: 8 },
  reasonBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start", marginBottom: 12 },
  reasonText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#D97706" },
  reportActions: { flexDirection: "row", gap: 10 },
  ignoreBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  ignoreBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },
  removeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#DC2626" },
  removeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  jobRow: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 14, marginBottom: 8, shadowColor: "#3B5BDB", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  jobLogo: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  jobLogoText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  jobTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  jobMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#64748B", marginVertical: 2 },
  jobBadges: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#D1FAE5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  verifiedText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#059669" },
  urgentBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  urgentText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  applicantText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#94A3B8" },
  moreText: { textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular", color: "#94A3B8", paddingVertical: 12 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#94A3B8", textAlign: "center" },
});
