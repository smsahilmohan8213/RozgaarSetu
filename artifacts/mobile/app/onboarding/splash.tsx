import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import * as SplashScreen from "expo-splash-screen";

export default function AppSplashScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();

  useEffect(() => {
    // Hide the native splash screen immediately, since we are showing our custom one
    SplashScreen.hideAsync().catch(() => {});

    // MVP: Simulate loading time and proceed to language selection
    const timer = setTimeout(() => {
      router.replace("/onboarding/welcome" as any);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <LinearGradient
      colors={[colors.gradientStart || "#1E40AF", colors.gradientEnd || "#3B82F6"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: "#ffffff" }]}>{t("RozgaarSetu")}</Text>
        <Text style={[styles.tagline, { color: "rgba(255,255,255,0.9)" }]}>
          {t("Find Jobs Near Your Home")}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
});
