import { Locale } from "@/context/AppContext";

export type LocaleKey = "en" | "hi" | "hinglish";


export const SUPPORTED_LOCALES: readonly Locale[] = [
  Locale.en,
  Locale.hi,
  Locale.hinglish,
] as const;

