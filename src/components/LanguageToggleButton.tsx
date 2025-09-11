"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageToggleButton = () => {
  const { i18n } = useTranslation();
  const [anim, setAnim] = React.useState(false);

  // Normalize to base language ('en' or 'fr') even if i18n.language is 'en-US'/'fr-FR'
  const baseLang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const currentLang = baseLang.toUpperCase();

  const toggleLang = () => {
    const next = baseLang === "en" ? "fr" : "en";
    i18n.changeLanguage(next);
    setAnim(true);
    setTimeout(() => setAnim(false), 600);
  };

  return (
    <Button
      onClick={toggleLang}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm btn-lang transition-colors`}
      variant="ghost"
      size="sm"
      aria-label="Changer de langue"
      title="Changer de langue"
    >
      <Globe className={`h-4 w-4 ${anim ? "animate-spin" : ""}`} />
      <span className="text-xs font-medium">{currentLang}</span>
    </Button>
  );
};