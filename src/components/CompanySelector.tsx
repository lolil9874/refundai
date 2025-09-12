"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { popularCompanies } from "@/lib/companies";

export function CompanySelector() {
  const { t } = useTranslation();
  const form = useFormContext();
  const watchCompany = useWatch({ control: form.control, name: "company" });

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.companyLabel")}</FormLabel>
            <FormControl>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {popularCompanies.map((company) => (
                  <Button
                    key={company.name}
                    type="button"
                    variant={field.value === company.name ? "default" : "outline"}
                    className={cn(
                      "flex items-center justify-center gap-2",
                      field.value !== company.name && "bg-white/50 dark:bg-black/20",
                    )}
                    onClick={() => field.onChange(company.name)}
                  >
                    <img
                      src={`https://logo.clearbit.com/${company.domain}`}
                      alt={`${company.name} logo`}
                      className={cn("h-5 w-5", field.value === company.name && "brightness-0 invert")}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {company.name}
                  </Button>
                ))}
                <Button
                  key="other"
                  type="button"
                  variant={field.value === "other" ? "default" : "outline"}
                  className={cn(field.value !== "other" && "bg-white/50 dark:bg-black/20")}
                  onClick={() => field.onChange("other")}
                >
                  {t("refundForm.otherButton")}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchCompany === "other" && (
        <FormField
          control={form.control}
          name="otherCompany"
          render={({ field }) => (
            <FormItem className="animate-in fade-in duration-300">
              <FormLabel>{t("refundForm.otherCompanyLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("refundForm.otherCompanyPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}