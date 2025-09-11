"use client";

import React from "react";
import { cn } from "@/lib/utils";

type GlassButtonProps = {
  href?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white " +
  "transition-all duration-300 will-change-transform " +
  // Glass + gradient + glow
  "backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/10 " +
  "bg-gradient-to-br from-sky-500/70 via-blue-500/70 to-indigo-500/70 " +
  "shadow-[0_8px_30px_rgba(56,189,248,0.35)] " +
  // Hover/active
  "hover:shadow-[0_12px_40px_rgba(56,189,248,0.55)] hover:from-sky-400/80 hover:to-indigo-500/80 active:scale-[0.98] " +
  // Focus
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60";

const chromeLayers =
  // Subtle inner gloss and radial lighting
  "before:absolute before:inset-0 before:rounded-full " +
  "before:bg-[radial-gradient(120%_80%_at_10%_0%,rgba(255,255,255,0.55),transparent_40%),radial-gradient(120%_80%_at_100%_100%,rgba(255,255,255,0.15),transparent_40%)] " +
  "before:opacity-80 before:pointer-events-none " +
  // Top sheen
  "after:absolute after:top-0 after:left-0 after:right-0 after:h-1/2 after:rounded-t-full " +
  "after:bg-white/15 after:blur-md after:opacity-70 after:pointer-events-none";

const sheenLayer =
  // Moving sheen on hover
  "overflow-hidden " +
  "[&>.sheen]:absolute [&>.sheen]:inset-0 [&>.sheen]:rounded-full " +
  "[&>.sheen]:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.5),transparent)] " +
  "[&>.sheen]:-translate-x-full group-hover:[&>.sheen]:translate-x-full " +
  "[&>.sheen]:transition-transform [&>.sheen]:duration-700";

export default function GlassButton(props: GlassButtonProps) {
  const { href, loading, className, children, ...rest } = props;
  const classes = cn(baseClasses, chromeLayers, sheenLayer, className);

  if (href) {
    const { target, rel, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        href={href}
        target={target}
        rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)}
        className={classes}
        {...anchorRest}
      >
        <span className="sheen" />
        {children}
      </a>
    );
  }

  const { disabled, ...buttonRest } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : "false"}
      {...buttonRest}
    >
      <span className="sheen" />
      {children}
    </button>
  );
}