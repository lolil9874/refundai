"use client";

import React from "react";
import { cn } from "@/lib/utils";
import "./uiverse-button.css";

type UiverseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children: React.ReactNode;
};

export default function UiverseButton({ className, children, ...rest }: UiverseButtonProps) {
  return (
    <button className={cn("uiverse-btn", className)} {...rest}>
      {children}
    </button>
  );
}