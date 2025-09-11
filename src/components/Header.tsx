import { Mail } from "lucide-react";
import { LanguageToggleButton } from "./LanguageToggleButton";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="relative sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm backdrop-saturate-150">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <Mail className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold">{t("header.appName")}</span>
        </div>
        <div className="flex items-center">
          <LanguageToggleButton />
        </div>
      </div>
    </header>
  );
};