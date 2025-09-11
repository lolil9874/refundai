"use client";

import React from "react";
import { cn } from "@/lib/utils";

type OffsetButtonProps = {
  href?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden " +
  "rounded-[4px] px-4 py-3 text-base leading-[1.5] " +
  "border border-black bg-[#93C5FD] text-black " +
  "transition-all duration-150 ease-out transform-gpu " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-1 " +
  "disabled:opacity-60 disabled:pointer-events-none " +
  "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_#000]";

export default function OffsetButton(props: OffsetButtonProps) {
  const { href, loading, className, children, ...rest } = props;
  const classes = cn(base, className);

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
      {children}
    </button>
  );
}