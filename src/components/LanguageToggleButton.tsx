"use client";

import React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const LanguageToggleButton = () => {
  const { i18n } = useTranslation();
  const [anim, setAnim] = React.useState(false);

  const currentLang = (i18n.language || "en").toString().toUpperCase();

  const toggleLang = () => {
    const next = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(next);
    setAnim(true);
    setTimeout(() => setAnim(false), 600);
  };

  return (
    <Button
      onClick={toggleLang}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 transition-colors"
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