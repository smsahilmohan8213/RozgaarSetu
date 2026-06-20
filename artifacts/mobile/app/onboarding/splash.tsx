import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import * as SplashScreen from "expo-splash-screen";
import Animated, { FadeIn, ZoomIn, FadeInDown, withRepeat, withTiming, withSequence } from "react-native-reanimated";

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
      colors={["#0F172A", "#1E3A8A", "#3B82F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(800).springify()} style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text entering={FadeInDown.duration(800).delay(300).springify()} style={[styles.title, { color: "#ffffff" }]}>
          {t("RozgaarSetu")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(800).delay(500).springify()} style={[styles.tagline, { color: "rgba(255,255,255,0.7)" }]}>
          {t("Find Jobs Near Your Home")}
        </Animated.Text>
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
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
});
