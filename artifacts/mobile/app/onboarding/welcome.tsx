import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Modal,
  SafeAreaView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  
  const { setLanguage, setGuestRole } = useApp();
  const { t } = useTranslation();
  
  const [modalVisible, setModalVisible] = useState(false);

  const handleGuest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setGuestRole("seeker");
    router.replace("/(tabs)");
  };

  const handleGoogle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth");
  };

  const handlePhone = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth");
  };

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    setModalVisible(false);
  };

  const styles = getStyles(colors, insets, isWeb);
  
  const { user } = useApp();
  const currentLang = user?.language || "English";
  const displayLang = currentLang === "English" ? "Eng" : currentLang === "Hinglish" ? "Hinglish" : "हिन्दी";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart || "#1E40AF", colors.gradientEnd || "#3B82F6"]}
        style={styles.heroBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.smallLogo}
              resizeMode="contain"
            />
            
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="language" size={16} color="#fff" />
              <Text style={styles.langText}>{displayLang}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t("Find Jobs Near Your Home") || "Find Jobs Near Your Home"}</Text>
            <Text style={styles.heroSub}>
              Discover verified local jobs near Rohini, Jahangirpuri, Pitampura, Azadpur, Model Town and nearby areas.
            </Text>
            
            <View style={styles.cardsRow}>
              <View style={styles.jobCard}>
                <Ionicons name="bicycle" size={24} color="#2563EB" />
                <Text style={styles.jobCardText}>Delivery Executive</Text>
              </View>
              <View style={styles.jobCard}>
                <Ionicons name="business" size={24} color="#059669" />
                <Text style={styles.jobCardText}>Office Executive</Text>
              </View>
              <View style={styles.jobCard}>
                <Ionicons name="cart" size={24} color="#D97706" />
                <Text style={styles.jobCardText}>Retail Staff</Text>
              </View>
            </View>
            <View style={styles.cardsRow2}>
              <View style={styles.jobCard}>
                <Ionicons name="construct" size={24} color="#7C3AED" />
                <Text style={styles.jobCardText}>Technician</Text>
              </View>
              <View style={styles.jobCard}>
                <Ionicons name="people" size={24} color="#DC2626" />
                <Text style={styles.jobCardText}>Recruiter Posting Jobs</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.bottomSheet}>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.benefitText}>Nearby Jobs</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.benefitText}>Verified Employers</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.benefitText}>One Tap Apply</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.benefitText}>Freshers Welcome</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.benefitText}>Local Hiring</Text>
          </View>
        </View>

        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogle}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.phoneBtn}
            onPress={handlePhone}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.phoneBtnText}>Continue with Phone Number</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleGuest}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHandle} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>Choose Language</Text>

            {["English", "Hinglish", "Hindi"].map((item) => {
              const selected = currentLang === item;
              const displayLabel = item === "Hindi" ? "हिन्दी" : item;
              return (
                <Pressable
                  key={item}
                  style={[styles.optionCard, selected && styles.optionCardSelected]}
                  onPress={() => changeLanguage(item)}
                  android_ripple={{ color: "rgba(30,64,175,0.08)" }}
                >
                  <Text style={[styles.optionCardText, selected && styles.optionCardTextSelected]}>
                    {displayLabel}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>, insets: any, isWeb: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroBackground: {
      flex: 1,
      paddingTop: isWeb ? 20 : 0,
    },
    safeArea: {
      flex: 1,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: isWeb ? 20 : insets.top + 10,
    },
    smallLogo: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    langBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    langText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    heroContent: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: "center",
      paddingBottom: 40,
    },
    heroTitle: {
      fontSize: 34,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      lineHeight: 42,
      marginBottom: 12,
    },
    heroSub: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.9)",
      lineHeight: 22,
      marginBottom: 30,
    },
    cardsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    cardsRow2: {
      flexDirection: "row",
      gap: 12,
    },
    jobCard: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 16,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    jobCardText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: "#1E293B",
      marginTop: 8,
      textAlign: "center",
    },
    bottomSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 30,
      paddingBottom: isWeb ? 40 : insets.bottom + 20,
      marginTop: -24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 10,
    },
    benefitsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 32,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#F0FDF4",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 100,
    },
    benefitText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: "#065F46",
    },
    authContainer: {
      gap: 14,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: "#FFFFFF",
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#E2E8F0",
    },
    googleBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#0F172A",
    },
    phoneBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: "#EEF2FF",
      paddingVertical: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: "#C7D2FE",
    },
    phoneBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
    },
    guestBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 16,
    },
    guestBtnText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#64748B",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    modalSheet: {
      backgroundColor: "#FFFFFF",
      paddingTop: 24,
      paddingHorizontal: 16,
      paddingBottom: isWeb ? 40 : insets.bottom + 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalHeaderRow: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    closeButton: {
      position: "absolute",
      right: 0,
      padding: 8,
    },
    modalHandle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(15, 23, 42, 0.16)",
    },
    modalTitle: {
      fontSize: 18,
      color: "#0F172A",
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      marginBottom: 24,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      backgroundColor: "#FFFFFF",
      marginBottom: 16,
    },
    optionCardSelected: {
      backgroundColor: "#DBEAFE",
      borderColor: "#1D4ED8",
    },
    optionCardText: {
      fontSize: 16,
      color: "#0F172A",
      fontFamily: "Inter_400Regular",
    },
    optionCardTextSelected: {
      color: "#1D4ED8",
      fontFamily: "Inter_700Bold",
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterSelected: {
      borderColor: "#1D4ED8",
      backgroundColor: "#DBEAFE",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#1D4ED8",
    },
  });
}
