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

type SortOption = "recent" | "salary" | "distance";

const JOB_TYPES = ["Full Time", "Part Time", "Freelance"];
const SALARY_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "₹15k+", value: 15000 },
  { label: "₹25k+", value: 25000 },
  { label: "₹40k+", value: 40000 },
];
const EXPERIENCE_OPTIONS = ["Fresher", "Experienced"];
const DATE_OPTIONS = ["Any time", "Past 24h", "Past week"];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const { postedJobs, user, setEditingJobId, deletePostedJob } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters State
  const [jobTypeFilter, setJobTypeFilter] = useState<string[]>([]);
  const [salaryFilter, setSalaryFilter] = useState<number>(0);
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
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
        const matchCat = selectedCategory === "All" || job.category === selectedCategory;

        const matchJobType = jobTypeFilter.length === 0 || jobTypeFilter.includes(job.jobType);
        const matchSalary = job.salaryMax >= salaryFilter;

        let matchExp = true;
        if (experienceFilter.length > 0) {
           const isFresher = job.experience === "0 years" || job.isFreshersOk;
           if (experienceFilter.includes("Fresher") && experienceFilter.includes("Experienced")) {
             matchExp = true;
           } else if (experienceFilter.includes("Fresher")) {
             matchExp = isFresher;
           } else if (experienceFilter.includes("Experienced")) {
             matchExp = !isFresher;
           }
        }

        let matchDate = true;
        if (dateFilter === "Past 24h") {
          matchDate = job.postedTime.includes("min") || job.postedTime.includes("hour");
        } else if (dateFilter === "Past week") {
          matchDate = job.postedTime.includes("min") || job.postedTime.includes("hour") || (job.postedTime.includes("day") && parseInt(job.postedTime) <= 7);
        }

        return matchSearch && matchCat && matchJobType && matchSalary && matchExp && matchDate;
      })
      .sort((a, b) => {
        if (sortBy === "salary") return b.salaryMax - a.salaryMax;
        if (sortBy === "distance") return a.distanceKm - b.distanceKm;
        return 0;
      });
  }, [postedJobs, search, selectedCategory, sortBy, jobTypeFilter, salaryFilter, experienceFilter, dateFilter]);

  const employerStats = useMemo(() => {
    const activeJobs = postedJobs.length;
    const totalApplicants = postedJobs.reduce((sum, job) => sum + job.applicants, 0);
    const urgentJobs = postedJobs.filter((job) => job.isUrgent).length;
    return { activeJobs, totalApplicants, urgentJobs };
  }, [postedJobs]);

  const styles = getStyles(colors);

  function handleDeleteJob(jobId: string, title: string) {
    const runDelete = async () => {
      await deletePostedJob(jobId);
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${title}"?`)) {
        void runDelete();
      }
      return;
    }

    Alert.alert("Delete Job", `Remove "${title}" from listings?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void runDelete();
        },
      },
    ]);
  }

  function handleEditJob(jobId: string) {
    setEditingJobId(jobId);
    router.push("/post-job");
  }

  function handleApplicants(jobId: string) {
    router.push(`/employer/applicants/${jobId}`);
  }

  if (isEmployer) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
          <Text style={styles.title}>My Jobs</Text>
          <Text style={styles.subtitle}>Manage live listings and applicants</Text>
        </View>

        <View style={styles.dashboardStrip}>
          <MetricCard label="Active Jobs" value={String(employerStats.activeJobs)} icon="briefcase" colors={colors} />
          <MetricCard label="Applicants" value={String(employerStats.totalApplicants)} icon="people" colors={colors} />
          <MetricCard label="Urgent" value={String(employerStats.urgentJobs)} icon="flash" colors={colors} />
        </View>

        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="add-circle"
            label="Post Job"
            color={colors.primary}
            onPress={() => router.push("/post-job")}
          />
          <QuickAction
            icon="people"
            label="View Applicants"
            color="#7C3AED"
            onPress={() => {
              const firstJob = postedJobs[0];
              if (firstJob) handleApplicants(firstJob.id);
            }}
          />
          <QuickAction
            icon="settings"
            label="Profile"
            color="#059669"
            onPress={() => router.push("/(tabs)/profile")}
          />
        </View>

        <FlatList
          data={postedJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 110 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Live Listings</Text>
              <Text style={styles.listCount}>{postedJobs.length} active</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyJobsState
              title="No jobs posted yet"
              text="Create your first listing and start receiving applicants."
              actionLabel="Post Job"
              onAction={() => router.push("/post-job")}
              colors={colors}
            />
          }
          renderItem={({ item }) => (
            <EmployerJobRow
              job={item}
              onEdit={() => handleEditJob(item.id)}
              onApplicants={() => handleApplicants(item.id)}
              onDelete={() => handleDeleteJob(item.id, item.title)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>Find Jobs</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Job title, company..."
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
          {(["All", ...CATEGORIES] as (JobCategory | "All")[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: "#fff", borderColor: colors.border },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, { color: selectedCategory === cat ? "#fff" : colors.foreground }]}>
                {cat}
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
        ListHeaderComponent={<Text style={styles.count}>{filteredSeekerJobs.length} jobs found</Text>}
        ListEmptyComponent={
          <EmptyJobsState
            title="No jobs match your search"
            text="Try a different keyword or category."
            onAction={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            actionLabel="Clear Filters"
            colors={colors}
          />
        }
        renderItem={({ item }) => <JobCard job={item} />}
      />

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & Sorting</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionTitle}>Sort by</Text>
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

            <Text style={styles.filterSectionTitle}>Job Type</Text>
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

            <Text style={styles.filterSectionTitle}>Minimum Salary</Text>
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

            <Text style={styles.filterSectionTitle}>Experience Level</Text>
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

            <Text style={styles.filterSectionTitle}>Date Posted</Text>
            <View style={styles.filterOptionsGrid}>
              {DATE_OPTIONS.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.sortChip, { backgroundColor: dateFilter === date ? colors.primary : "#EEF2FF" }]}
                  onPress={() => setDateFilter(date)}
                >
                  <Text style={[styles.sortText, { color: dateFilter === date ? "#fff" : colors.primary }]}>
                    {date}
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
              <Text style={styles.modalClearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.modalApplyBtnText}>Show Results</Text>
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

function EmployerJobRow({
  job,
  onEdit,
  onApplicants,
  onDelete,
}: {
  job: {
    id: string;
    title: string;
    company: string;
    logoInitials: string;
    logoColor: string;
    location: string;
    salary: string;
    applicants: number;
    isUrgent: boolean;
    postedTime: string;
  };
  onEdit: () => void;
  onApplicants: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.headerRow}>
        <View style={[rowStyles.logo, { backgroundColor: `${job.logoColor}18` }]}>
          <Text style={[rowStyles.logoText, { color: job.logoColor }]}>{job.logoInitials}</Text>
        </View>
        <View style={rowStyles.info}>
          <Text style={rowStyles.title} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={rowStyles.meta} numberOfLines={1}>
            {job.company} · {job.location}
          </Text>
          <Text style={rowStyles.salary}>{job.salary}</Text>
        </View>
      </View>

      <View style={rowStyles.badgeRow}>
        {job.isUrgent && (
          <View style={rowStyles.urgentBadge}>
            <Ionicons name="flash" size={11} color="#DC2626" />
            <Text style={rowStyles.urgentText}>Urgent</Text>
          </View>
        )}
        <View style={rowStyles.applicantBadge}>
          <Ionicons name="people" size={11} color="#059669" />
          <Text style={rowStyles.applicantText}>{job.applicants} applicants</Text>
        </View>
        <Text style={rowStyles.time}>{job.postedTime}</Text>
      </View>

      <View style={rowStyles.actions}>
        <TouchableOpacity style={[rowStyles.actionBtn, rowStyles.secondaryAction]} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color="#2563EB" />
          <Text style={rowStyles.secondaryActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rowStyles.actionBtn, rowStyles.primaryAction]} onPress={onApplicants}>
          <Ionicons name="people-outline" size={16} color="#fff" />
          <Text style={rowStyles.primaryActionText}>Applicants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[rowStyles.actionBtn, rowStyles.dangerAction]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
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
