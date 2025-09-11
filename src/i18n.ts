import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationFR from "./locales/fr/translation.json";

const resources = {
  en: {
    translation: translationEN,
  },
  fr: {
    translation: translationFR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Default to English
    fallbackLng: "en",
    // Only support 'en' and 'fr'; normalize 'en-US' -> 'en', 'fr-FR' -> 'fr'
    supportedLngs: ["en", "fr"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    // Only detect from storage/cookies; do not auto-detect from browser
    detection: {
      order: ["localStorage", "cookie"],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;