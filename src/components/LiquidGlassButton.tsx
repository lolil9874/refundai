"use client";

import React from "react";
import { cn } from "@/lib/utils";

type LiquidGlassButtonProps = {
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const baseClasses =
  "relative inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold text-white " +
  "transition-all duration-300 ease-in-out overflow-hidden " +
  // Glassmorphism effect
  "bg-gradient-to-br from-white/20 to-white/5 " +
  "backdrop-blur-lg " +
  "border border-white/20 " +
  "shadow-lg shadow-black/20 " +
  // Hover state
  "hover:border-white/30 " +
  // Active state
  "active:scale-[0.98] " +
  // Focus state
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const highlightClass =
  // Highlight appears on hover
  "before:content-[''] " +
  "before:absolute before:inset-0 before:rounded-2xl " +
  "before:bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.4),transparent_60%)] " +
  "before:opacity-0 hover:before:opacity-100 " +
  "before:transition-opacity before:duration-300 before:ease-in-out";

export default function LiquidGlassButton({ className, children, ...rest }: LiquidGlassButtonProps) {
  const classes = cn(baseClasses, highlightClass, className);

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}