import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useColors } from "@/hooks/useColors";

type ApplyStep = "confirm" | "sending" | "success";

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { applyToJob, user } = useApp();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState<ApplyStep>("confirm");

  const job = JOBS.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.foreground }}>Job not found</Text>
      </View>
    );
  }

  async function handleApply() {
    setStep("sending");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 2000));
    await applyToJob(job!.id);
    setStep("success");
  }

  const styles = getStyles(colors);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === "success" ? "Application Sent!" : "Apply for Job"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 60 : insets.bottom + 30 },
        ]}
      >
        {step === "success" ? (
          <View style={styles.successView}>
            <View style={[styles.successCircle, { backgroundColor: colors.successFg }]}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Application Sent!
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your application for {job.title} at {job.company} has been submitted successfully.
            </Text>

            <View style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.trackTitle, { color: colors.foreground }]}>
                  What happens next?
                </Text>
                <Text style={[styles.trackText, { color: colors.mutedForeground }]}>
                  The employer will review your application and may contact you via WhatsApp or phone within 1-3 days.
                </Text>
              </View>
            </View>

            <View style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="notifications" size={20} color={colors.warning} />
              <View>
                <Text style={[styles.trackTitle, { color: colors.foreground }]}>
                  Stay Alert
                </Text>
                <Text style={[styles.trackText, { color: colors.mutedForeground }]}>
                  Keep your WhatsApp active. Employers often reach out directly.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/saved")}
            >
              <Text style={styles.doneBtnText}>View My Applications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.homeBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={[styles.homeBtnText, { color: colors.foreground }]}>
                Browse More Jobs
              </Text>
            </TouchableOpacity>
          </View>
        ) : step === "sending" ? (
          <View style={styles.sendingView}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.sendingText, { color: colors.foreground }]}>
              Submitting your application...
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.jobSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.logo, { backgroundColor: job.logoColor + "22" }]}>
                <Text style={[styles.logoText, { color: job.logoColor }]}>
                  {job.logoInitials}
                </Text>
              </View>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
                <Text style={[styles.jobCompany, { color: colors.mutedForeground }]}>{job.company}</Text>
                <Text style={[styles.jobSalary, { color: colors.success }]}>{job.salary}</Text>
              </View>
            </View>

            <View style={[styles.profileSummary, { backgroundColor: colors.muted }]}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.psTitle, { color: colors.foreground }]}>
                  Applying as:
                </Text>
                <Text style={[styles.psName, { color: colors.foreground }]}>
                  {user.name || "Guest User"} · +91 {user.phone || "XXXXXXXXXX"}
                </Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                Your contact information will be shared with the employer. They may reach out via WhatsApp or call.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Ionicons name="paper-plane" size={18} color="#fff" />
              <Text style={styles.applyBtnText}>Submit Application</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    placeholder: { width: 32 },
    scroll: { padding: 20, gap: 14 },
    jobSummary: {
      flexDirection: "row",
      gap: 14,
      alignItems: "center",
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
    },
    logo: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    logoText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    jobInfo: { flex: 1 },
    jobTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    jobCompany: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
    jobSalary: { fontSize: 14, fontFamily: "Inter_700Bold" },
    profileSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 14,
    },
    psTitle: { fontSize: 11, fontFamily: "Inter_400Regular" },
    psName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderRadius: 14,
    },
    infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 16,
    },
    applyBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
    },
    cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
    sendingView: { alignItems: "center", justifyContent: "center", paddingVertical: 100, gap: 20 },
    sendingText: { fontSize: 16, fontFamily: "Inter_500Medium" },
    successView: { alignItems: "center", paddingVertical: 20, gap: 14 },
    successCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
    successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
    trackCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      width: "100%",
    },
    trackTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
    trackText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
    doneBtn: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 8,
    },
    doneBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
    homeBtn: {
      width: "100%",
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
    },
    homeBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  });
}
