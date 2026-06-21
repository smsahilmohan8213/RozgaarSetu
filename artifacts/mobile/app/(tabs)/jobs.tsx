import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { ComponentProps, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { useApp } from "@/context/AppContext";
import { CATEGORIES, type JobCategory } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";

type SortOption = "recent" | "salary" | "distance";

const JOB_TYPES = ["Full Time", "Part Time", "Contract"];
const SALARY_OPTIONS = [
  { label: "10k+", value: 10000 },
  { label: "15k+", value: 15000 },
  { label: "20k+", value: 20000 },
  { label: "30k+", value: 30000 },
];
const EXPERIENCE_OPTIONS = ["Fresher", "1 Year", "2 Years", "3+ Years"];
const LOCATION_OPTIONS = ["Rohini", "Jahangirpuri", "Pitampura", "Delhi NCR"];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const { postedJobs, applications, user, setEditingJobId, deletePostedJob, setEmployerJobStatus, employerJobStatuses, requireAuth } = useApp();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters State
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
  const [salaryFilter, setSalaryFilter] = useState<number>(0);
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>("Any time");

  const isEmployer = user.role === "employer";

  const filteredSeekerJobs = useMemo(() => {
    return postedJobs
      .filter((job) => {
        const matchSearch =
          !search ||
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.company.toLowerCase().includes(search.toLowerCase()) ||
          job.location.toLowerCase().includes(search.toLowerCase());
        const matchQuick = 
          quickFilter === "All" ||
          (quickFilter === "Fresher" && (job.experience === "0 years" || job.isFreshersOk)) ||
          (quickFilter === "Full Time" && job.jobType === "Full Time") ||
          (quickFilter === "Part Time" && job.jobType === "Part Time") ||
          (quickFilter === "Work From Home" && job.location.toLowerCase().includes("home")) ||
          (quickFilter === "Urgent Hiring" && job.isUrgent) ||
          (quickFilter === "Verified Employer" && job.isVerified);

        const matchJobType = jobTypeFilter.length === 0 || jobTypeFilter.includes(job.jobType);
        const matchSalary = job.salaryMax >= salaryFilter;
        const matchLocation = locationFilter.length === 0 || locationFilter.includes(job.location);

        let matchExp = true;
        if (experienceFilter.length > 0) {
           const isFresher = job.experience === "0 years" || job.isFreshersOk;
           if (experienceFilter.includes("Fresher") && isFresher) {
             matchExp = true;
           } else if (experienceFilter.includes("1 Year") && job.experience.includes("1")) {
             matchExp = true;
           } else if (experienceFilter.includes("2 Years") && job.experience.includes("2")) {
             matchExp = true;
           } else if (experienceFilter.includes("3+ Years") && (job.experience.includes("3") || job.experience.includes("4") || job.experience.includes("5"))) {
             matchExp = true;
           } else {
             matchExp = false;
           }
        }

        let matchDate = true;
        if (dateFilter === "Past 24h") {
          matchDate = job.postedTime.includes("min") || job.postedTime.includes("hour");
        } else if (dateFilter === "Past week") {
          matchDate = job.postedTime.includes("min") || job.postedTime.includes("hour") || (job.postedTime.includes("day") && parseInt(job.postedTime) <= 7);
        }

        return matchSearch && matchQuick && matchJobType && matchSalary && matchLocation && matchExp && matchDate;
      })
      .sort((a, b) => {
        if (sortBy === "salary") return b.salaryMax - a.salaryMax;
        if (sortBy === "distance") return a.distanceKm - b.distanceKm;
        return 0; // "recent" mock: just keep current order as it's static
      });
  }, [postedJobs, search, quickFilter, sortBy, jobTypeFilter, salaryFilter, experienceFilter, locationFilter, dateFilter]);

  const employerStats = useMemo(() => {
    const activeJobs = postedJobs.length;
    const totalApplicants = applications.filter((a) => postedJobs.some((j) => j.id === a.jobId)).length;
    const urgentJobs = postedJobs.filter((job) => job.isUrgent).length;
    return { activeJobs, totalApplicants, urgentJobs };
  }, [postedJobs]);

  const styles = getStyles(colors);

  function handleDeleteJob(jobId: string, title: string) {
    requireAuth(() => {
      Alert.alert("Delete Job", `Remove "${title}" from listings?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deletePostedJob(jobId) },
      ]);
    }, { title: "Sign in to Delete", description: "Create an employer account to delete jobs.", maybeLaterText: "Maybe Later" });
  }

  function handleStatusToggle(jobId: string, currentStatus: "active" | "paused" | "closed", targetStatus: "active" | "paused" | "closed") {
    requireAuth(() => {
      setEmployerJobStatus(jobId, targetStatus);
    }, { title: "Sign in to Change Status", description: "Create an employer account to pause, resume or close jobs.", maybeLaterText: "Maybe Later" });
  }

  const [employerTab, setEmployerTab] = useState<"All" | "Active" | "Paused" | "Closed">("All");

  const employerDisplayJobs = useMemo(() => {
    return postedJobs.filter((job) => {
      const status = employerJobStatuses[job.id] || "active";
      if (employerTab === "All") return true;
      return status.toLowerCase() === employerTab.toLowerCase();
    });
  }, [postedJobs, employerTab, employerJobStatuses]);

  function handleEditJob(jobId: string) {
    requireAuth(() => {
      setEditingJobId(jobId);
      router.push("/post-job");
    }, { title: "Sign in to Edit Job", description: "Create an employer account to edit jobs.", maybeLaterText: "Maybe Later" });
  }

  function handleApplicants(jobId: string) {
    router.push(`/employer/applicants/${jobId}`);
  }

  if (isEmployer) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
          <Text style={styles.title}>{t("My Jobs") || "My Jobs"}</Text>
          <Text style={styles.subtitle}>{t("Manage your listings and applicants") || "Manage your listings and applicants"}</Text>
        </View>

        <View style={styles.empTabs}>
          {(["All", "Active", "Paused", "Closed"] as const).map(tab => (
             <TouchableOpacity 
               key={tab} 
               style={[styles.empTab, employerTab === tab && styles.empTabActive]}
               onPress={() => setEmployerTab(tab)}
             >
               <Text style={[styles.empTabText, employerTab === tab && styles.empTabTextActive]}>{t(tab)}</Text>
             </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={employerDisplayJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyJobsState
              title={t("No Jobs Posted")}
              text={employerTab === "All" ? t("Post your first job to start receiving applicants.") : `You have no ${employerTab.toLowerCase()} jobs.`}
              actionLabel={t("Post Job")}
              onAction={() => requireAuth(() => router.push("/post-job"), { title: t("Sign in to continue"), description: t("Create an account to unlock all RozgaarSetu features."), maybeLaterText: t("Maybe Later") })}
              colors={colors}
            />
          }
          renderItem={({ item }) => (
            <EmployerJobCard
              job={item}
              status={employerJobStatuses[item.id] || "active"}
              onEdit={() => handleEditJob(item.id)}
              onApplicants={() => handleApplicants(item.id)}
              onDelete={() => handleDeleteJob(item.id, item.title)}
              onToggleStatus={(newStatus) => handleStatusToggle(item.id, employerJobStatuses[item.id] || "active", newStatus)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>{t("Find Jobs") || "Find Jobs"}</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t("Job title, company...") || "Job title, company..."}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: showFilters ? colors.primary : "#EEF2FF" },
            ]}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Ionicons name="options" size={16} color={showFilters ? "#fff" : colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {["All", "Fresher", "Full Time", "Part Time", "Work From Home", "Urgent Hiring", "Verified Employer"].map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[
                styles.catChip,
                quickFilter === chip
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: "#fff", borderColor: colors.border },
              ]}
              onPress={() => setQuickFilter(chip)}
            >
              <Text style={[styles.catText, { color: quickFilter === chip ? "#fff" : colors.foreground }]}>
                {t(chip)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


      </View>

      <FlatList
        data={filteredSeekerJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 110 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.count}>{filteredSeekerJobs.length} {t("jobs found")}</Text>}
        ListEmptyComponent={
            <EmptyJobsState
            title={search ? t("No search results") : t("No jobs found")}
            text={search ? t("Try checking for typos or searching a different keyword.") : t("Try adjusting your filters or categories to find more jobs.")}
            onAction={() => {
              setSearch("");
              setQuickFilter("All");
              setSortBy("recent");
              setJobTypeFilter([]);
              setSalaryFilter(0);
              setExperienceFilter([]);
              setLocationFilter([]);
            }}
            actionLabel={t("Clear Filters")}
            colors={colors}
          />
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("Filters & Sorting") || "Filters & Sorting"}</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionTitle}>{t("Sort by") || "Sort by"}</Text>
            <View style={styles.filterOptionsGrid}>
              {(["recent", "salary", "distance"] as SortOption[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sortChip, { backgroundColor: sortBy === opt ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setSortBy(opt)}
                >
                  <Text style={[styles.sortText, { color: sortBy === opt ? "#fff" : colors.primary }]}>
                    {opt === "recent" ? "Newest" : opt === "salary" ? "Salary" : "Nearest"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>{t("Job Type")}</Text>
            <View style={styles.filterOptionsGrid}>
              {JOB_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.sortChip, { backgroundColor: jobTypeFilter.includes(type) ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setJobTypeFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                >
                  <Text style={[styles.sortText, { color: jobTypeFilter.includes(type) ? "#fff" : colors.primary }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>{t("Minimum Salary")}</Text>
            <View style={styles.filterOptionsGrid}>
              {SALARY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.sortChip, { backgroundColor: salaryFilter === opt.value ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setSalaryFilter(opt.value)}
                >
                  <Text style={[styles.sortText, { color: salaryFilter === opt.value ? "#fff" : colors.primary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>{t("Experience Level")}</Text>
            <View style={styles.filterOptionsGrid}>
              {EXPERIENCE_OPTIONS.map((exp) => (
                <TouchableOpacity
                  key={exp}
                  style={[styles.sortChip, { backgroundColor: experienceFilter.includes(exp) ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setExperienceFilter(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp])}
                >
                  <Text style={[styles.sortText, { color: experienceFilter.includes(exp) ? "#fff" : colors.primary }]}>
                    {exp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>{t("Location")}</Text>
            <View style={styles.filterOptionsGrid}>
              {LOCATION_OPTIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.sortChip, { backgroundColor: locationFilter.includes(loc) ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setLocationFilter(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
                >
                  <Text style={[styles.sortText, { color: locationFilter.includes(loc) ? "#fff" : colors.primary }]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalClearBtn} 
              onPress={() => {
                setSortBy("recent");
                setJobTypeFilter([]);
                setSalaryFilter(0);
                setExperienceFilter([]);
                setDateFilter("Any time");
              }}
            >
              <Text style={styles.modalClearBtnText}>{t("Clear All") || "Clear All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.modalApplyBtnText}>{t("Show Results") || "Show Results"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[metricStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[metricStyles.icon, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[metricStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[metricStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={actionStyles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[actionStyles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={actionStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyJobsState({
  title,
  text,
  actionLabel,
  onAction,
  colors,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: colors.accent }]}>
        <Ionicons name="briefcase-outline" size={34} color={colors.primary} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.text}>{text}</Text>
      <TouchableOpacity style={[emptyStyles.button, { backgroundColor: colors.primary }]} onPress={onAction}>
        <Text style={emptyStyles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}



const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 104,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});

const actionStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    textAlign: "center",
  },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 28,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    textAlign: "center",
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    gap: 12,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
    marginTop: 2,
  },
  salary: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#059669",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
  },
  urgentText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#DC2626",
  },
  applicantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
  },
  applicantText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#059669",
  },
  time: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#94A3B8",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#EEF2FF",
  },
  secondaryActionText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#2563EB",
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#2563EB",
  },
  primaryActionText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  dangerAction: {
    width: 42,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
});

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    empTabs: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
      backgroundColor: "#FFFFFF",
    },
    empTab: {
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    empTabActive: {
      borderBottomColor: "#2563EB",
    },
    empTabText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: "#64748B",
    },
    empTabTextActive: {
      color: "#2563EB",
      fontFamily: "Inter_600SemiBold",
    },
    dashboardStrip: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    listTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    listCount: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    count: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 12,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 18,
      backgroundColor: "#F8FAFF",
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 12,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    filterBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryRow: {
      gap: 8,
      paddingBottom: 4,
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    catText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    filtersRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 1,
      flexWrap: "wrap",
    },
    filterLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    sortChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "transparent",
    },
    sortText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    modalClose: {
      padding: 4,
    },
    modalScroll: {
      flex: 1,
      padding: 20,
    },
    filterSectionTitle: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginBottom: 12,
      marginTop: 20,
    },
    filterOptionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    modalFooter: {
      flexDirection: "row",
      padding: 20,
      paddingBottom: 34,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      gap: 12,
    },
    modalClearBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
    },
    modalClearBtnText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#475569",
    },
    modalApplyBtn: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    modalApplyBtnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
}

function EmployerJobCard({
  job,
  status,
  onEdit,
  onApplicants,
  onDelete,
  onToggleStatus,
}: {
  job: any;
  status: "active" | "paused" | "closed";
  onEdit: () => void;
  onApplicants: () => void;
  onDelete: () => void;
  onToggleStatus: (newStatus: "active" | "paused" | "closed") => void;
}) {
  const isClosed = status === "closed";
  const isPaused = status === "paused";
  const { t } = useTranslation();

  return (
    <View style={empCardStyles.card}>
      <View style={empCardStyles.headerRow}>
        <View style={empCardStyles.titleWrap}>
          <Text style={empCardStyles.title} numberOfLines={1}>{job.title}</Text>
          <Text style={empCardStyles.meta}>{t(job.location)} · {job.salary}</Text>
        </View>
        <View style={[
          empCardStyles.statusBadge, 
          status === "active" ? { backgroundColor: "#D1FAE5" } : 
          status === "paused" ? { backgroundColor: "#FEF08A" } : { backgroundColor: "#F1F5F9" }
        ]}>
          <Text style={[
            empCardStyles.statusText,
             status === "active" ? { color: "#059669" } : 
             status === "paused" ? { color: "#854D0E" } : { color: "#475569" }
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={empCardStyles.statsRow}>
        <TouchableOpacity style={empCardStyles.statItem} onPress={onApplicants}>
          <Ionicons name="people" size={16} color="#2563EB" />
          <Text style={empCardStyles.statText}>{applications.filter((a) => a.jobId === job.id).length} Applicants</Text>
        </TouchableOpacity>
        <View style={empCardStyles.statItem}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={empCardStyles.statTextLight}>Posted {job.postedTime}</Text>
        </View>
      </View>

      <View style={empCardStyles.actionsRow}>
        <TouchableOpacity style={empCardStyles.actionBtn} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color="#64748B" />
          <Text style={empCardStyles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        {status === "active" ? (
          <TouchableOpacity style={empCardStyles.actionBtn} onPress={() => onToggleStatus("paused")}>
            <Ionicons name="pause" size={16} color="#64748B" />
            <Text style={empCardStyles.actionText}>Pause</Text>
          </TouchableOpacity>
        ) : status === "paused" ? (
          <TouchableOpacity style={empCardStyles.actionBtn} onPress={() => onToggleStatus("active")}>
            <Ionicons name="play" size={16} color="#059669" />
            <Text style={[empCardStyles.actionText, { color: "#059669" }]}>Resume</Text>
          </TouchableOpacity>
        ) : null}

        {!isClosed && (
          <TouchableOpacity style={empCardStyles.actionBtn} onPress={() => onToggleStatus("closed")}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={[empCardStyles.actionText, { color: "#EF4444" }]}>Close</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[empCardStyles.actionBtn, { marginLeft: "auto", borderRightWidth: 0 }]} onPress={onDelete}>
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const empCardStyles = StyleSheet.create({
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#2563EB",
  },
  statTextLight: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#64748B",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#64748B",
  },
});
