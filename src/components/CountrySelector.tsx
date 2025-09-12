"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
];

export function CountrySelector() {
  const { t } = useTranslation();
  const form = useFormContext();
  const watchCompany = useWatch({ control: form.control, name: "company" });

  return (
    <FormField
      control={form.control}
      name="country"
      render={({ field }) => (
        <FormItem className={watchCompany === "other" ? "animate-in fade-in duration-300" : ""}>
          <FormLabel>{t("refundForm.countryLabel")}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("refundForm.countryPlaceholder")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start w-full h-auto p-2 gap-2"
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </Button>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}