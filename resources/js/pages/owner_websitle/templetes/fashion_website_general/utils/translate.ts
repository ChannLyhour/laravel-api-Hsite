import en from "../lang/en.json";
import km from "../lang/km.json";
import zh from "../lang/zh.json";

const translations: Record<string, any> = { en, km, zh };

export const useTranslation = (locale: string = "en") => {
  const t = (key: string): string => {
    const keys = key.split(".");
    const lang = locale === "kh" ? "km" : (locale || "en").toLowerCase(); // handle kh fallback to km
    let current = translations[lang] || translations["en"];

    for (const k of keys) {
      if (current && typeof current === "object") {
        current = current[k];
      } else {
        return key;
      }
    }
    return typeof current === "string" ? current : key;
  };

  return { t };
};
