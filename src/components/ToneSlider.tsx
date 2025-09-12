"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function ToneSlider() {
  const { t, i18n } = useTranslation();
  const form = useFormContext();
  const watchTone = form.watch("tone");

  const value = typeof watchTone === "number" ? watchTone : 50;

  return (
    <FormField
      control={form.control}
      name="tone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("refundForm.tone.label")}</FormLabel>
          <FormControl>
            <div className="relative mt-3 pt-8">
              <div
                className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${value}%` }}
              >
                <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-foreground shadow">
                  {value}%
                </span>
              </div>
              <div
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{ left: "50%" }}
              >
                <div className="h-4 w-[2px] bg-muted-foreground/40 rounded" />
              </div>
              <Slider
                value={[value]}
                min={0}
                max={100}
                step={1}
                onValueChange={(vals) => field.onChange(vals[0] ?? 0)}
                aria-label={t("refundForm.tone.label") as string}
              />
              <div className="mt-2 grid grid-cols-3 text-[11px] text-muted-foreground">
                <span className="justify-self-start">{t("refundForm.tone.empathic")}</span>
                <span className="justify-self-center">{t("refundForm.tone.formal")}</span>
                <span className="justify-self-end">{t("refundForm.tone.firm")}</span>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}