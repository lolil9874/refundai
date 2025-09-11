import { LanguageToggleButton } from "./LanguageToggleButton";

export const Header = () => {
  return (
    <header className="relative w-full border-b border-border/40 bg-background/80 backdrop-blur-sm backdrop-saturate-150">
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