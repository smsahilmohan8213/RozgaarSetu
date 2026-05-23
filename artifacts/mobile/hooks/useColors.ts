import colors from "@/constants/colors";

/**
 * Always returns the light (premium) palette.
 * Dark mode has been intentionally removed — RozgaarSetu uses a
 * fixed premium light theme for maximum trust and readability.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
