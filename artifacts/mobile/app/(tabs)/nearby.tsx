import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobCard } from "@/components/JobCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { JOBS } from "@/data/jobs";
import { useColors } from "@/hooks/useColors";

type RadiusOption = 1 | 2 | 5 | 10;

const USER_LAT = 28.748;
const USER_LNG = 77.12;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState<RadiusOption>(5);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const effectiveLat = userLat ?? USER_LAT;
  const effectiveLng = userLng ?? USER_LNG;

  const nearbyJobs = JOBS.map((job) => ({
    ...job,
    computedDistance: haversineKm(effectiveLat, effectiveLng, job.lat, job.lng),
  }))
    .filter((j) => j.computedDistance <= radius)
    .sort((a, b) => a.computedDistance - b.computedDistance);

  async function requestLocation() {
    setLocationLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === "web") {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
            setLocationGranted(true);
            setLocationLoading(false);
          },
          () => {
            setLocationGranted(true);
            setLocationLoading(false);
          }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationGranted(true);
        } else {
          setLocationGranted(true);
        }
        setLocationLoading(false);
      }
    } catch {
      setLocationGranted(true);
      setLocationLoading(false);
    }
  }

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? 67 : insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Nearby Jobs
        </Text>

        {!locationGranted ? (
          <TouchableOpacity
            style={[styles.locationBtn, { backgroundColor: colors.primary }]}
            onPress={requestLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={18} color="#fff" />
                <Text style={styles.locationBtnText}>Enable Location</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.locationActive}>
            <Ionicons name="location" size={16} color={colors.success} />
            <Text style={[styles.locationActiveText, { color: colors.success }]}>
              {userLat ? "Using your location" : "Using Rohini, Delhi"}
            </Text>
          </View>
        )}

        <View style={styles.radiusRow}>
          <Text style={[styles.radiusLabel, { color: colors.mutedForeground }]}>
            Radius:
          </Text>
          {([1, 2, 5, 10] as RadiusOption[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusChip,
                {
                  backgroundColor: radius === r ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setRadius(r)}
            >
              <Text
                style={[
                  styles.radiusText,
                  { color: radius === r ? "#fff" : colors.foreground },
                ]}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={nearbyJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: isWeb ? 100 : 90 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.countRow}>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {nearbyJobs.length} jobs within {radius} km
            </Text>
            {nearbyJobs.some((j) => j.isUrgent) && (
              <View style={[styles.urgentPill, { backgroundColor: colors.urgentFg || "#FEE2E2" }]}>
                <Ionicons name="flash" size={12} color={colors.urgent} />
                <Text style={[styles.urgentPillText, { color: colors.urgent }]}>
                  {nearbyJobs.filter((j) => j.isUrgent).length} urgent
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No jobs in {radius} km
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try increasing the radius
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <View
              style={[
                styles.distanceBadge,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={[styles.distanceText, { color: colors.primary }]}>
                {item.computedDistance.toFixed(1)} km away
              </Text>
            </View>
            <JobCard job={item} />
          </View>
        )}
      />
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 12 },
    locationBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    locationBtnText: {
      color: "#fff",
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
    },
    locationActive: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
    },
    locationActiveText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    radiusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    radiusLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
    radiusChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    radiusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    list: { paddingHorizontal: 16, paddingTop: 12 },
    countRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    count: { fontSize: 13, fontFamily: "Inter_400Regular" },
    urgentPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    urgentPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    cardWrapper: { marginBottom: -4 },
    distanceBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-end",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 4,
    },
    distanceText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
    emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  });
}
