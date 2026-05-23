import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const colors = useColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <SkeletonBox width={48} height={48} borderRadius={14} />
        <View style={styles.headerInfo}>
          <SkeletonBox width="80%" height={16} />
          <SkeletonBox width="50%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonBox width="60%" height={14} style={{ marginBottom: 10 }} />
      <View style={styles.chips}>
        <SkeletonBox width={90} height={26} borderRadius={20} />
        <SkeletonBox width={80} height={26} borderRadius={20} />
        <SkeletonBox width={100} height={26} borderRadius={20} />
      </View>
      <View style={styles.actions}>
        <SkeletonBox width="60%" height={42} borderRadius={14} />
        <SkeletonBox width="36%" height={42} borderRadius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
});
