import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type UserRole } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Alert } from "react-native";

type Step = "role" | "phone" | "otp" | "name";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useApp();
  const isWeb = Platform.OS === "web";

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRoleSelect(r: UserRole) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRole(r);
    setStep("phone");
  }

  async function handlePhoneSubmit() {
    if (phone.length < 10) return;
    setLoading(true);
    // MVP: Simulate OTP send delay
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 300);
  }

  async function handleOtpSubmit() {
    if (otp.length < 6) return;
    setLoading(true);
    // MVP: Accept only 123456
    if (otp === "123456") {
      setLoading(false);
      setStep("name");
    } else {
      setLoading(false);
      Alert.alert("Invalid OTP", "Try: 123456 for MVP");
    }
  }

  async function handleNameSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await login(phone, name, role);
      router.replace("/(tabs)");
    } catch (error: any) {
      const message =
        error?.message ??
        (typeof error === "string" ? error : "Failed to complete onboarding");
      Alert.alert("Onboarding failed", message);
      console.log("[auth] handleNameSubmit failed", error);
    } finally {
      setLoading(false);
    }
  }

  const styles = getStyles(colors);

  return (
    <LinearGradient
      colors={[colors.gradientStart || "#1E40AF", colors.gradientEnd || "#3B82F6", "#60A5FA"]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: isWeb ? 100 : insets.top + 40,
            paddingBottom: isWeb ? 50 : insets.bottom + 30,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>RozgaarSetu</Text>
          <Text style={styles.tagline}>Your Bridge to Better Jobs</Text>
        </View>

        <View style={styles.card}>
          {step === "role" && (
            <>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                I am a...
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Choose your role to get started
              </Text>
              <TouchableOpacity
                style={[styles.roleBtn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
                onPress={() => handleRoleSelect("seeker")}
              >
                <Ionicons name="person" size={28} color={colors.primary} />
                <View style={styles.roleText}>
                  <Text style={[styles.roleName, { color: colors.foreground }]}>
                    Job Seeker
                  </Text>
                  <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                    Find jobs near you
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => handleRoleSelect("employer")}
              >
                <MaterialCommunityIcons name="office-building" size={28} color={colors.foreground} />
                <View style={styles.roleText}>
                  <Text style={[styles.roleName, { color: colors.foreground }]}>
                    Employer
                  </Text>
                  <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                    Post jobs & hire talent
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              <Text style={[styles.trustNote, { color: colors.mutedForeground }]}>
                Trusted by 50,000+ workers across Delhi NCR
              </Text>
            </>
          )}

          {step === "phone" && (
            <>
              <TouchableOpacity onPress={() => setStep("role")} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Enter Phone Number
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                We'll send you a verification OTP
              </Text>

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Text style={[styles.countryCode, { color: colors.foreground }]}>+91</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: phone.length === 10 ? 1 : 0.5 }]}
                onPress={handlePhoneSubmit}
                disabled={phone.length < 10 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === "otp" && (
            <>
              <TouchableOpacity onPress={() => setStep("phone")} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Enter OTP
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Sent to +91 {phone}
              </Text>

              <TextInput
  style={[
    styles.otpInput,
    {
      borderColor: colors.primary,
      color: colors.foreground,
      backgroundColor: colors.muted,
    },
  ]}
  placeholder="6-digit OTP"
  placeholderTextColor={colors.mutedForeground}
  keyboardType="number-pad"
  maxLength={6}
  value={otp}
  onChangeText={(text) => {
    console.log("OTP:", text, "Length:", text.length);
    setOtp(text);
  }}
/>

              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                 Enter the 6-digit OTP sent to your phone
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: otp.length === 6 ? 1 : 0.5 }]}
                onPress={handleOtpSubmit}
                disabled={otp.length < 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === "name" && (
            <>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                What's your name?
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Help employers know who you are
              </Text>

              <TextInput
                style={[styles.nameInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: name.trim().length > 2 ? 1 : 0.5 }]}
                onPress={handleNameSubmit}
                disabled={name.trim().length < 3 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Get Started</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    gradient: { flex: 1 },
    container: {
      paddingHorizontal: 20,
      alignItems: "center",
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 40,
    },
    logoBox: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    logoImage: { width: 64, height: 64 },
    appName: {
      fontSize: 32,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    tagline: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    card: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      marginBottom: 6,
    },
    cardSub: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginBottom: 24,
    },
    roleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 12,
    },
    roleText: { flex: 1 },
    roleName: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    roleDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    trustNote: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 8,
    },
    backBtn: {
      marginBottom: 16,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 20,
      gap: 10,
    },
    countryCode: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    divider: {
      width: 1,
      height: 20,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
    },
    otpInput: {
      borderWidth: 2,
      borderRadius: 14,
      padding: 16,
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
      letterSpacing: 8,
    },
    nameInput: {
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      marginBottom: 20,
    },
    hint: {
      fontSize: 12,
      textAlign: "center",
      marginBottom: 20,
    },
    primaryBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
  });
}
