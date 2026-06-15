import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const styles = getStyles(colors);

  return (
    <LinearGradient
      colors={[colors.gradientStart || "#1E40AF", colors.gradientEnd || "#3B82F6", "#60A5FA"]}
      style={styles.gradient}
    >
      <View style={[styles.container, { paddingTop: isWeb ? 100 : insets.top + 40, paddingBottom: isWeb ? 50 : insets.bottom + 30 }]}>
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
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Sign in or continue as a guest to explore.</Text>

          <TouchableOpacity
            style={[styles.authBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Mock action for Google Auth
              router.push("/auth"); 
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={[styles.authBtnText, { color: colors.foreground }]}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authBtn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Route to existing Phone Auth
              router.push("/auth");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={[styles.authBtnText, { color: colors.foreground }]}>Continue with Phone</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/onboarding/role" as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </TouchableOpacity>

          <Text style={[styles.trustNote, { color: colors.mutedForeground }]}>
            Trusted by 50,000+ workers across Delhi NCR
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    gradient: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "space-between",
    },
    logoSection: {
      alignItems: "center",
      marginTop: 20,
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
      fontSize: 16,
      color: "rgba(255,255,255,0.9)",
      fontFamily: "Inter_500Medium",
      marginTop: 6,
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
    authBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 12,
    },
    authBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
      paddingHorizontal: 20,
    },
    divider: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    guestBtn: {
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
    },
    guestBtnText: {
      color: colors.primary,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    trustNote: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 16,
    },
  });
}
