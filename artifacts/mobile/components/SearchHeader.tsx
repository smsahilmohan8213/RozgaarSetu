import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface SearchHeaderProps {
  greeting?: string;
  name?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onNotification?: () => void;
}

export function SearchHeader({
  greeting = "Good morning",
  name = "there",
  searchValue,
  onSearchChange,
  onNotification,
}: SearchHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [language, setLanguage] = useState("Eng");
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingLang, setPendingLang] = useState<string>(language);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { paddingTop: isWeb ? 67 : insets.top + 12 },
        ]}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.name}>{name}</Text>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => {
                setPendingLang(language);
                setModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="language" size={16} color="#fff" />
              <Text style={styles.langText}>{language}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notifBtn}
              onPress={onNotification}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

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

              {[
                "Eng",
                "Hinglish",
                "हिन्दी",
              ].map((item) => {
                const selected = pendingLang === item;
                return (
                  <Pressable
                    key={item}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => setPendingLang(item)}
                    android_ripple={{ color: "rgba(30,64,175,0.08)" }}
                  >
                    <Text style={[styles.optionCardText, selected && styles.optionCardTextSelected]}>
                      {item}
                    </Text>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => {
                  setLanguage(pendingLang);
                  setModalVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search jobs, companies, skills..."
            placeholderTextColor={colors.mutedForeground}
            value={searchValue}
            onChangeText={onSearchChange}
          />
          {searchValue.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.1,
  },
  name: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FCD34D",
    position: "absolute",
    top: 9,
    right: 9,
    borderWidth: 1.5,
    borderColor: "rgba(30,64,175,0.6)",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginTop: -22,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  langText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
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
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
  continueBtn: {
    marginTop: 24,
    width: "100%",
    backgroundColor: "#1D4ED8",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
