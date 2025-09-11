import { useState, useEffect } from "react";
import { LanguageToggleButton } from "./LanguageToggleButton";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-sm backdrop-saturate-150"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="REFUND.AI Logo" className="h-8" />
        </div>
        <div className="flex items-center">
          <LanguageToggleButton />
        </div>
      </div>
    </header>
  );
};