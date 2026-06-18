import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "expo-router";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maybeLaterText?: string;
}

export function AuthModal({ visible, onClose, title = "Sign in to continue", description = "Create an account to unlock all RozgaarSetu features.", maybeLaterText = "Maybe Later" }: AuthModalProps) {
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={32} color="#2563EB" />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            {description}
          </Text>

          <TouchableOpacity
            style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => {
              onClose();
              router.push("/auth");
            }}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={[styles.btnText, { color: colors.foreground }]}>{t("Continue with Google")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { borderColor: colors.primary, backgroundColor: colors.accent }]}
            onPress={() => {
              onClose();
              router.push("/auth");
            }}
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.foreground }]}>{t("Continue with Phone")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <Text style={[styles.signInBtnText, { color: colors.foreground }]}>{maybeLaterText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      }
    }),
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  signInBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
