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
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

export default function RoleSelectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setGuestRole } = useApp();
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
      colors={["#0F172A", "#1E3A8A", "#3B82F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={[styles.container, { paddingTop: isWeb ? 100 : insets.top + 40, paddingBottom: isWeb ? 50 : insets.bottom + 30 }]}>
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.logoBox}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(600).delay(100).springify()} style={styles.appName}>
            RozgaarSetu
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(600).delay(200).springify()} style={styles.tagline}>
            {t("Select your role")}
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.duration(800).delay(400).springify()} style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("I am a...")}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{t("Choose how you want to explore the app.")}</Text>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              {
                borderColor: selectedRole === "seeker" ? colors.primary : colors.border,
                backgroundColor: selectedRole === "seeker" ? "#EFF6FF" : colors.card
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedRole("seeker");
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: selectedRole === "seeker" ? "#DBEAFE" : "#F1F5F9" }]}>
              <Ionicons name="person" size={24} color={selectedRole === "seeker" ? colors.primary : "#64748B"} />
            </View>
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
                backgroundColor: selectedRole === "employer" ? "#EFF6FF" : colors.card
              }
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedRole("employer");
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: selectedRole === "employer" ? "#DBEAFE" : "#F1F5F9" }]}>
              <MaterialCommunityIcons name="office-building" size={24} color={selectedRole === "employer" ? colors.primary : "#64748B"} />
            </View>
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
            style={[styles.primaryBtn, { backgroundColor: selectedRole ? colors.primary : "#E2E8F0" }]}
            onPress={handleComplete}
            disabled={!selectedRole}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: selectedRole ? "#fff" : "#94A3B8" }]}>{t("Start Exploring")}</Text>
          </TouchableOpacity>
        </Animated.View>
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
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    logoImage: { width: 56, height: 56 },
    appName: {
      fontSize: 32,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      letterSpacing: -1,
    },
    tagline: {
      fontSize: 16,
      color: "rgba(255,255,255,0.8)",
      fontFamily: "Inter_500Medium",
      marginTop: 6,
    },
    card: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 32,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 20,
    },
    cardTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      marginBottom: 6,
    },
    cardSub: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      marginBottom: 28,
    },
    roleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      marginBottom: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    roleText: { flex: 1 },
    roleName: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
    },
    roleDesc: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    primaryBtn: {
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 16,
      shadowColor: "#1D4ED8",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryBtnText: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
    },
  });
}
