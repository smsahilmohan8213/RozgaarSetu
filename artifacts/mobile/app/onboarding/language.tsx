import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";

export default function LanguageSelectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updateProfile } = useApp();
  const isWeb = Platform.OS === "web";
  
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  
  const languages = [
    { id: "English", label: "English", sub: "A A" },
    { id: "Hinglish", label: "Hinglish", sub: "A अ" },
    { id: "Hindi", label: "हिंदी", sub: "अ अ" },
  ];

  async function handleContinue() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({ language: selectedLanguage });
    router.push("/onboarding/welcome" as any);
  }

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
          <Text style={styles.tagline}>Select your language</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Language</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>You can change this later in Profile</Text>

          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.langBtn,
                  { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.accent : colors.card }
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedLanguage(lang.id);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.langLeft}>
                  <Text style={[styles.langIcon, { color: isSelected ? colors.primary : colors.mutedForeground }]}>{lang.sub}</Text>
                  <Text style={[styles.langLabel, { color: colors.foreground }]}>{lang.label}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                {!isSelected && <View style={[styles.unselectedRadio, { borderColor: colors.mutedForeground }]} />}
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
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
    langBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 12,
    },
    langLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    langIcon: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      width: 32,
      textAlign: "center",
    },
    langLabel: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
    },
    unselectedRadio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
    },
    primaryBtn: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 12,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Inter_700Bold",
    },
  });
}
