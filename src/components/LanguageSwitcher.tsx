import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={i18n.language === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => changeLanguage("en")}
      >
        EN
      </Button>
      <Button
        variant={i18n.language === "fr" ? "default" : "ghost"}
        size="sm"
        onClick={() => changeLanguage("fr")}
      >
        FR
      </Button>
    </div>
  );
};