import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { hasOnboarded, isReady } = useApp();

  if (!isReady) return null;

  if (hasOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href={"/onboarding/splash" as any} />;
}
