import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type DraftJob } from "@/context/AppContext";
import { CATEGORIES, LOCALITIES, type JobCategory } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

const JOB_TYPES = ["Full Time", "Part Time", "Freelance"] as const;
const EXPERIENCE_OPTIONS = ["Fresher", "1-2 years", "3-5 years", "5+ years"];
const LOCALITIES_NO_ALL = LOCALITIES.filter((l) => l !== "All Areas");

const STEP_TITLES = ["Basic Info", "Pay & Type", "Details"];

export default function PostJobScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { postJob, updateJob, user, postedJobs, editingJobId } = useApp();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reqInput, setReqInput] = useState("");

  // Get the job being edited, if any
  const editingJob = editingJobId ? postedJobs.find((j) => j.id === editingJobId) : null;

  const [draft, setDraft] = useState<DraftJob>(() => {
    if (editingJob) {
      return {
        title: editingJob.title,
        company: editingJob.company,
        category: editingJob.category,
        location: editingJob.location,
        salaryMin: editingJob.salaryMin,
        salaryMax: editingJob.salaryMax,
        jobType: editingJob.jobType,
        experience: editingJob.experience,
        isFreshersOk: editingJob.isFreshersOk,
        isUrgent: editingJob.isUrgent,
        isNegotiable: editingJob.isNegotiable,
        description: editingJob.description,
        requirements: editingJob.requirements,
        whatsappNumber: editingJob.whatsappNumber,
      };
    }
    return {
      title: "",
      company: user.name ? `${user.name}'s Business` : "",
      category: "Delivery",
      location: "Rohini",
      salaryMin: 15000,
      salaryMax: 25000,
      jobType: "Full Time",
      experience: "Fresher",
      isFreshersOk: true,
      isUrgent: false,
      isNegotiable: false,
      description: "",
      requirements: [],
      whatsappNumber: user.phone,
    };
  });

  function set<K extends keyof DraftJob>(key: K, val: DraftJob[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  function addRequirement() {
    const trimmed = reqInput.trim();
    if (!trimmed) return;
    set("requirements", [...draft.requirements, trimmed]);
    setReqInput("");
  }

  function removeRequirement(i: number) {
    set(
      "requirements",
      draft.requirements.filter((_, idx) => idx !== i)
    );
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!draft.title.trim()) return "Please enter a job title.";
      if (!draft.company.trim()) return "Please enter your company name.";
    }
    if (step === 1) {
      if (draft.salaryMin <= 0) return "Please enter a valid minimum salary.";
      if (draft.salaryMax < draft.salaryMin)
        return "Maximum salary must be ≥ minimum salary.";
    }
    if (step === 2) {
      if (!draft.description.trim() || draft.description.trim().length < 20)
        return "Please write a description (at least 20 characters).";
      if (!draft.whatsappNumber.trim() || draft.whatsappNumber.length < 10)
        return "Please enter a valid WhatsApp number.";
    }
    return null;
  }

  async function handleNext() {
    const err = validateStep();
    if (err) {
      if (Platform.OS === "web") {
        window.alert(err);
      } else {
        Alert.alert("Missing Info", err);
      }
      return;
    }
    if (step < 2) {
      if (Platform.OS !== "web") Haptics.selectionAsync();
      setStep((s) => s + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editingJob && editingJobId) {
        await updateJob(editingJobId, draft);
      } else {
        await postJob(draft);
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/profile");
    } catch (_) {
      if (Platform.OS === "web") window.alert("Something went wrong. Please try again.");
      else Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const styles = getStyles(colors);

  // Restrict posting to employers
  if (user.role !== "employer") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background }}>
        <Ionicons name="lock-closed" size={48} color="#94A3B8" />
        <Text style={{ fontSize: 18, fontFamily: "Inter_600SemiBold", color: "#0F172A", marginTop: 12, marginBottom: 8 }}>
          Employers Only
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B", textAlign: "center", marginBottom: 18 }}>
          You must sign in as an employer to post jobs. Create or switch to an employer account to continue.
        </Text>
        <TouchableOpacity style={{ backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }} onPress={() => router.push("/auth")}>
          <Text style={{ color: "#fff", fontFamily: "Inter_700Bold" }}>Sign in as Employer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top + 8 },
        ]}
      >
        <TouchableOpacity onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {editingJob ? "Edit Job" : "Post a Job"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Step {step + 1} of 3 — {STEP_TITLES[step]}
          </Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / 3) * 100}%` as "100%", backgroundColor: colors.primary },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 120 : insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Step0
            draft={draft}
            set={set}
            colors={colors}
            styles={styles}
          />
        )}
        {step === 1 && (
          <Step1
            draft={draft}
            set={set}
            colors={colors}
            styles={styles}
          />
        )}
        {step === 2 && (
          <Step2
            draft={draft}
            set={set}
            reqInput={reqInput}
            setReqInput={setReqInput}
            addRequirement={addRequirement}
            removeRequirement={removeRequirement}
            colors={colors}
            styles={styles}
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: isWeb ? 24 : insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: submitting ? colors.muted : colors.primary },
          ]}
          onPress={handleNext}
          disabled={submitting}
          activeOpacity={0.82}
        >
          <Text style={styles.nextBtnText}>
            {submitting
              ? editingJob
                ? "Updating…"
                : "Posting…"
              : step === 2
                ? editingJob
                  ? "Update Job"
                  : "Post Job"
                : "Continue"}
          </Text>
          {!submitting && (
            <Ionicons
              name={step === 2 ? "checkmark-circle" : "arrow-forward"}
              size={20}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Step0({
  draft,
  set,
  colors,
  styles,
}: {
  draft: DraftJob;
  set: <K extends keyof DraftJob>(k: K, v: DraftJob[K]) => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.stepContainer}>
      <SectionLabel label="Job Title" colors={colors} />
      <TextInput
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
        placeholder="e.g. Delivery Executive"
        placeholderTextColor={colors.mutedForeground}
        value={draft.title}
        onChangeText={(v) => set("title", v)}
        returnKeyType="next"
      />

      <SectionLabel label="Company / Business Name" colors={colors} />
      <TextInput
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
        placeholder="e.g. Sharma Traders"
        placeholderTextColor={colors.mutedForeground}
        value={draft.company}
        onChangeText={(v) => set("company", v)}
        returnKeyType="next"
      />

      <SectionLabel label="Category" colors={colors} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.pill,
              draft.category === cat
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => set("category", cat as JobCategory)}
          >
            <Text
              style={[
                styles.pillText,
                { color: draft.category === cat ? "#fff" : colors.foreground },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionLabel label="Location" colors={colors} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {LOCALITIES_NO_ALL.map((loc) => (
          <TouchableOpacity
            key={loc}
            style={[
              styles.pill,
              draft.location === loc
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => set("location", loc)}
          >
            <Text
              style={[
                styles.pillText,
                { color: draft.location === loc ? "#fff" : colors.foreground },
              ]}
            >
              {loc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function Step1({
  draft,
  set,
  colors,
  styles,
}: {
  draft: DraftJob;
  set: <K extends keyof DraftJob>(k: K, v: DraftJob[K]) => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.stepContainer}>
      <SectionLabel label="Monthly Salary Range (₹)" colors={colors} />
      <View style={styles.salaryRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.salaryHint, { color: colors.mutedForeground }]}>Minimum</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            keyboardType="number-pad"
            placeholder="15000"
            placeholderTextColor={colors.mutedForeground}
            value={draft.salaryMin > 0 ? String(draft.salaryMin) : ""}
            onChangeText={(v) => set("salaryMin", parseInt(v.replace(/[^0-9]/g, "")) || 0)}
          />
        </View>
        <Text style={[styles.salarySep, { color: colors.mutedForeground }]}>–</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.salaryHint, { color: colors.mutedForeground }]}>Maximum</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            keyboardType="number-pad"
            placeholder="25000"
            placeholderTextColor={colors.mutedForeground}
            value={draft.salaryMax > 0 ? String(draft.salaryMax) : ""}
            onChangeText={(v) => set("salaryMax", parseInt(v.replace(/[^0-9]/g, "")) || 0)}
          />
        </View>
      </View>

      <SectionLabel label="Job Type" colors={colors} />
      <View style={styles.pillRow}>
        {JOB_TYPES.map((jt) => (
          <TouchableOpacity
            key={jt}
            style={[
              styles.pill,
              draft.jobType === jt
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => set("jobType", jt)}
          >
            <Text style={[styles.pillText, { color: draft.jobType === jt ? "#fff" : colors.foreground }]}>
              {jt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel label="Experience Required" colors={colors} />
      <View style={styles.pillRow}>
        {EXPERIENCE_OPTIONS.map((exp) => (
          <TouchableOpacity
            key={exp}
            style={[
              styles.pill,
              draft.experience === exp
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
            onPress={() => set("experience", exp)}
          >
            <Text style={[styles.pillText, { color: draft.experience === exp ? "#fff" : colors.foreground }]}>
              {exp}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.togglesSection}>
        <ToggleRow
          label="Freshers can apply"
          sub="Open to candidates with no prior experience"
          value={draft.isFreshersOk}
          onToggle={() => set("isFreshersOk", !draft.isFreshersOk)}
          colors={colors}
        />
        <ToggleRow
          label="Salary is negotiable"
          sub="Shown as negotiable in the listing"
          value={draft.isNegotiable}
          onToggle={() => set("isNegotiable", !draft.isNegotiable)}
          colors={colors}
        />
        <ToggleRow
          label="Urgent hiring"
          sub="Shown with urgent badge — higher visibility"
          value={draft.isUrgent}
          onToggle={() => set("isUrgent", !draft.isUrgent)}
          colors={colors}
          last
        />
      </View>
    </View>
  );
}

function Step2({
  draft,
  set,
  reqInput,
  setReqInput,
  addRequirement,
  removeRequirement,
  colors,
  styles,
}: {
  draft: DraftJob;
  set: <K extends keyof DraftJob>(k: K, v: DraftJob[K]) => void;
  reqInput: string;
  setReqInput: (v: string) => void;
  addRequirement: () => void;
  removeRequirement: (i: number) => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.stepContainer}>
      <SectionLabel label="Job Description" colors={colors} />
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
        ]}
        placeholder="Describe the role, responsibilities, and what makes it great…"
        placeholderTextColor={colors.mutedForeground}
        value={draft.description}
        onChangeText={(v) => set("description", v)}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
        {draft.description.length} / 500 characters
      </Text>

      <SectionLabel label="Requirements (optional)" colors={colors} />
      <View style={styles.reqRow}>
        <TextInput
          style={[
            styles.input,
            { flex: 1, color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          ]}
          placeholder="e.g. Own bike, Android phone"
          placeholderTextColor={colors.mutedForeground}
          value={reqInput}
          onChangeText={setReqInput}
          onSubmitEditing={addRequirement}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addReqBtn, { backgroundColor: colors.primary }]}
          onPress={addRequirement}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {draft.requirements.map((req, i) => (
        <View key={i} style={[styles.reqChip, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Text style={[styles.reqChipText, { color: colors.foreground }]}>{req}</Text>
          <TouchableOpacity onPress={() => removeRequirement(i)}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ))}

      <SectionLabel label="WhatsApp Contact Number" colors={colors} />
      <View style={[styles.input, styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.prefix, { color: colors.mutedForeground }]}>+91</Text>
        <TextInput
          style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 15 }}
          placeholder="9876543210"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          maxLength={10}
          value={draft.whatsappNumber}
          onChangeText={(v) => set("whatsappNumber", v.replace(/[^0-9]/g, ""))}
        />
      </View>
      <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
        Applicants will contact you directly on WhatsApp
      </Text>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 20, marginBottom: 8 }}>
      {label}
    </Text>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
  colors,
  last,
}: {
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          gap: 12,
        },
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 }}>{sub}</Text>
      </View>
      <View
        style={{
          width: 46,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? colors.primary : colors.muted,
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#fff",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
    headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
    progressTrack: { height: 3, marginHorizontal: 0 },
    progressFill: { height: 3 },
    scroll: { paddingHorizontal: 16 },
    stepContainer: { paddingTop: 8 },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    prefix: { fontFamily: "Inter_500Medium", fontSize: 15 },
    textArea: { minHeight: 120, paddingTop: 12 },
    charCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 4 },
    salaryRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
    salarySep: { fontSize: 20, fontFamily: "Inter_400Regular", paddingBottom: 12 },
    salaryHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
    pillScroll: { marginBottom: 4 },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    togglesSection: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      marginTop: 20,
    },
    reqRow: { flexDirection: "row", gap: 10, alignItems: "center" },
    addReqBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    reqChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 8,
      gap: 10,
    },
    reqChipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      backgroundColor: colors.background,
    },
    nextBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: 16,
    },
    nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });
}
