import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useState } from "react";
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
import { useApp } from "@/context/AppContext";
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
  const { postedJobs } = useApp();

  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [radius, setRadius] = useState<RadiusOption>(5);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const effectiveLat = userLat ?? USER_LAT;
  const effectiveLng = userLng ?? USER_LNG;

  const allJobs = postedJobs;
  const nearbyJobs = allJobs
    .map((job) => ({
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top + 8 }]}>
        <Text style={styles.title}>Nearby Jobs</Text>

        {!locationGranted ? (
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={requestLocation}
            disabled={locationLoading}
            activeOpacity={0.85}
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
            <View style={styles.locationDot} />
            <Text style={styles.locationActiveText}>
              {userLat ? "Using your location" : "Using Rohini, Delhi"}
            </Text>
          </View>
        )}

        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Radius:</Text>
          {([1, 2, 5, 10] as RadiusOption[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.radiusChip,
                { backgroundColor: radius === r ? "#2563EB" : "#EEF2FF" },
              ]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusText, { color: radius === r ? "#fff" : "#0F172A" }]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={nearbyJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 100 : 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.countRow}>
            <Text style={styles.count}>{nearbyJobs.length} jobs within {radius} km</Text>
            {nearbyJobs.some((j) => j.isUrgent) && (
              <View style={styles.urgentPill}>
                <Ionicons name="flash" size={12} color="#DC2626" />
                <Text style={styles.urgentPillText}>
                  {nearbyJobs.filter((j) => j.isUrgent).length} urgent
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="map-outline" size={40} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>No jobs in {radius} km</Text>
            <Text style={styles.emptyText}>Try increasing the radius above</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate" size={11} color="#2563EB" />
              <Text style={styles.distanceText}>{item.computedDistance.toFixed(1)} km away</Text>
            </View>
            <JobCard job={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#3B5BDB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0F172A", marginBottom: 12 },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  locationBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  locationActive: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#059669" },
  locationActiveText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#059669" },
  radiusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  radiusLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#64748B" },
  radiusChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  radiusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#64748B" },
  urgentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
  },
  urgentPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#DC2626" },
  cardWrapper: { marginBottom: -4 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    marginBottom: 4,
  },
  distanceText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#2563EB" },
  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#0F172A" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#64748B" },
});
