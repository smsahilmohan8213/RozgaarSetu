import { useApp, Locale } from "@/context/AppContext";

import { DICTIONARY } from "@/locales/dictionary";
function localeToDictionaryKey(locale: Locale) {
  switch (locale) {
    case Locale.en:
      return "en" as const;
    case Locale.hi:
      return "hi" as const;
    case Locale.hinglish:
      return "hinglish" as const;
    default:
      return "en" as const;
  }
}


export function useTranslation() {
  const { user } = useApp();
  const langKey = localeToDictionaryKey(user.locale ?? Locale.en);

  return {
    t: (key: string) => {
      return DICTIONARY[langKey]?.[key] || DICTIONARY.en?.[key] || key;
    },
  };
}

