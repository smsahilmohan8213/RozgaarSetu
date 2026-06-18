import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function RoleSelectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setGuestRole, completeOnboarding } = useApp();
  const { t } = useTranslation();
  const isWeb = Platform.OS === "web";
  
  const [selectedRole, setSelectedRole] = useState<"seeker" | "employer" | null>(null);

  async function handleComplete() {
    if (!selectedRole) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setGuestRole(selectedRole);
    router.push("/(tabs)" as any);
  }

  const styles = getStyles(colors);

  return (
    <LinearGradient
      colors={[colors.gradientStart || "#1E40AF", colors.gradientEnd || "#3B82F6", "#60A5FA"]}
      style={styles.gradient}
    >
      <View style={[styles.container, { paddingTop: isWeb ? 100 : insets.top + 40, paddingBottom: isWeb ? 50 : insets.bottom + 30 }]}>
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>RozgaarSetu</Text>
          <Text style={styles.tagline}>{t("Select your role")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("I am a...")}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{t("Choose how you want to explore the app.")}</Text>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              {
                borderColor: selectedRole === "seeker" ? colors.primary : colors.border,
                backgroundColor: selectedRole === "seeker" ? colors.accent : colors.card
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedRole("seeker");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={28} color={selectedRole === "seeker" ? colors.primary : colors.foreground} />
            <View style={styles.roleText}>
              <Text style={[styles.roleName, { color: colors.foreground }]}>
                {t("Job Seeker")}
              </Text>
              <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                {t("Find jobs near you")}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={selectedRole === "seeker" ? colors.primary : "transparent"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              {
                borderColor: selectedRole === "employer" ? colors.primary : colors.border,
                backgroundColor: selectedRole === "employer" ? colors.accent : colors.card
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedRole("employer");
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="office-building" size={28} color={selectedRole === "employer" ? colors.primary : colors.foreground} />
            <View style={styles.roleText}>
              <Text style={[styles.roleName, { color: colors.foreground }]}>
                {t("Employer")}
              </Text>
              <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                {t("Post jobs & hire talent")}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={selectedRole === "employer" ? colors.primary : "transparent"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: selectedRole ? colors.primary : colors.border }]}
            onPress={handleComplete}
            disabled={!selectedRole}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: selectedRole ? "#fff" : colors.mutedForeground }]}>{t("Start Exploring")}</Text>
          </TouchableOpacity>
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
      width: "100%",
    },
    backBtn: {
      position: "absolute",
      left: 0,
      top: 0,
      padding: 8,
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
    primaryBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 12,
    },
    primaryBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
  });
}
