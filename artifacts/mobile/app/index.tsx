import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function Index() {
  const { hasOnboarded } = useApp();

  if (hasOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href={"/onboarding/language" as any} />;
}
