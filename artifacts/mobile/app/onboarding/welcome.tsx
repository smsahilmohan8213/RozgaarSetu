import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Modal,
  SafeAreaView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  
  const { setLanguage, setGuestRole, user } = useApp();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);

  const handleGuest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setGuestRole("seeker");
    router.replace("/(tabs)");
  };

  const handleAuth = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth");
  };

  const changeLanguage = async (lang: string) => {
    await setLanguage(lang);
    setModalVisible(false);
  };

  const styles = getStyles(colors, insets, isWeb);
  
  const currentLang =
    user?.locale === "en"
      ? "English"
      : user?.locale === "hinglish"
        ? "Hinglish"
        : user?.locale === "hi"
          ? "Hindi"
          : "English";
  const displayLang = currentLang === "English" ? "Eng" : currentLang === "Hinglish" ? "Hinglish" : "हिन्दी";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <Animated.View entering={ZoomIn.duration(600)}>
              <BlurView intensity={20} tint="light" style={styles.smallLogoWrap}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.smallLogo}
                  resizeMode="contain"
                />
              </BlurView>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(600).delay(100)}>
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.75}>
                <BlurView intensity={20} tint="light" style={styles.langBtn}>
                  <Ionicons name="language" size={16} color="#fff" />
                  <Text style={styles.langText}>{displayLang}</Text>
                  <Ionicons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 2 }} />
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <View style={styles.heroContent}>
            <Animated.Text entering={FadeInDown.duration(600).delay(200).springify()} style={styles.heroTitle}>
              {t("Find Jobs Near Your Home")}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(600).delay(300).springify()} style={styles.heroSub}>
              {t("Discover verified local jobs near Rohini, Jahangirpuri, Pitampura, Azadpur, Model Town and nearby areas.")}
            </Animated.Text>
            
            <View style={styles.cardsRow}>
              <JobCardPill icon="bicycle" label={t("Delivery")} color="#60A5FA" delay={400} />
              <JobCardPill icon="business" label={t("Office")} color="#34D399" delay={500} />
              <JobCardPill icon="cart" label={t("Retail")} color="#FBBF24" delay={600} />
            </View>
            <View style={styles.cardsRow2}>
              <JobCardPill icon="construct" label={t("Technician")} color="#A78BFA" delay={700} />
              <JobCardPill icon="people" label={t("HR/Admin")} color="#F87171" delay={800} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.View entering={FadeInDown.duration(800).delay(500).springify()} style={styles.bottomSheet}>
        <View style={styles.handleBarWrap}><View style={styles.handleBar} /></View>
        
        <Text style={styles.sheetTitle}>{t("Get Started")}</Text>

        <View style={styles.authContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAuth}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>{t("Continue with Phone")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleAuth}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.googleBtnText}>{t("Continue with Google")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={handleGuest}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>{t("Continue as Guest")}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.benefitsWrap}>
          <BenefitItem text={t("Nearby Jobs")} />
          <BenefitItem text={t("Verified")} />
          <BenefitItem text={t("Free")} />
        </View>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHandle} />
            </View>
            <Text style={styles.modalTitle}>{t("Choose Language")}</Text>

            {["English", "Hinglish", "Hindi"].map((item) => {
              const selected = currentLang === item;
              const displayLabel = item === "Hindi" ? "हिन्दी" : item;
              return (
                <Pressable
                  key={item}
                  style={[styles.optionCard, selected && styles.optionCardSelected]}
                  onPress={() => changeLanguage(item)}
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
          </Animated.View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function JobCardPill({ icon, label, color, delay }: { icon: any; label: string; color: string; delay: number }) {
  return (
    <Animated.View entering={ZoomIn.duration(500).delay(delay).springify()}>
      <BlurView intensity={30} tint="light" style={pillStyles.card}>
        <View style={[pillStyles.iconWrap, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={pillStyles.text}>{label}</Text>
      </BlurView>
    </Animated.View>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View style={pillStyles.benefit}>
      <Ionicons name="checkmark-circle" size={14} color="#059669" />
      <Text style={pillStyles.benefitText}>{text}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    marginRight: 4,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  benefitText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#475569",
  }
});

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
      paddingHorizontal: 24,
      paddingTop: isWeb ? 20 : insets.top + 10,
    },
    smallLogoWrap: {
      borderRadius: 14,
      overflow: "hidden",
      padding: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    smallLogo: {
      width: 28,
      height: 28,
    },
    langBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    langText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    heroContent: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      paddingBottom: 60,
    },
    heroTitle: {
      fontSize: 40,
      fontFamily: "Inter_700Bold",
      color: "#fff",
      lineHeight: 48,
      marginBottom: 16,
      letterSpacing: -1,
    },
    heroSub: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.85)",
      lineHeight: 24,
      marginBottom: 32,
    },
    cardsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 10,
    },
    cardsRow2: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    bottomSheet: {
      backgroundColor: "#ffffff",
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: isWeb ? 40 : insets.bottom + 20,
      marginTop: -40,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
      elevation: 20,
    },
    handleBarWrap: {
      alignItems: "center",
      marginBottom: 24,
    },
    handleBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#E2E8F0",
    },
    sheetTitle: {
      fontSize: 24,
      fontFamily: "Inter_700Bold",
      color: "#0F172A",
      marginBottom: 24,
      textAlign: "center",
    },
    authContainer: {
      gap: 16,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#1D4ED8",
      paddingVertical: 16,
      borderRadius: 16,
      shadowColor: "#1D4ED8",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    primaryBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#fff",
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
    guestBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
    },
    guestBtnText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: "#64748B",
    },
    benefitsWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#F1F5F9",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
      backgroundColor: "#FFFFFF",
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: isWeb ? 40 : insets.bottom + 24,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 10,
    },
    modalHeaderRow: {
      alignItems: "center",
      marginBottom: 24,
    },
    modalHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#E2E8F0",
    },
    modalTitle: {
      fontSize: 20,
      color: "#0F172A",
      fontFamily: "Inter_700Bold",
      textAlign: "center",
      marginBottom: 24,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: "#F1F5F9",
      backgroundColor: "#FFFFFF",
      marginBottom: 12,
    },
    optionCardSelected: {
      backgroundColor: "#EFF6FF",
      borderColor: "#3B82F6",
    },
    optionCardText: {
      fontSize: 16,
      color: "#0F172A",
      fontFamily: "Inter_500Medium",
    },
    optionCardTextSelected: {
      color: "#1D4ED8",
      fontFamily: "Inter_700Bold",
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterSelected: {
      borderColor: "#3B82F6",
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#3B82F6",
    },
  });
}
