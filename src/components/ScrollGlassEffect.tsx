"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ScrollGlassEffect = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show effect after scrolling a small amount
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-5 z-50 transition-opacity duration-300 pointer-events-none",
        "bg-background/80 backdrop-blur-sm",
        isScrolled ? "opacity-100" : "opacity-0"
      )}
      aria-hidden="true"
    />
  );
};