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
    // Set English as the default language
    lng: "en",
    // Fallback to English if a translation is missing
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    // Allow language to be saved in localStorage/cookie
    detection: {
      order: ["localStorage", "cookie"],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;