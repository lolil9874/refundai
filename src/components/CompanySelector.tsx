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
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.companyLabel")}</FormLabel>
            <FormControl>
              <Input placeholder={t("refundForm.otherCompanyPlaceholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {popularCompanies.map((company) => (
          <Button
            key={company.name}
            type="button"
            variant={watchCompany === company.name ? "default" : "outline"}
            className={cn(watchCompany !== company.name && "bg-white/50 dark:bg-black/20")}
            onClick={() => {
              form.setValue("company", company.name, { shouldValidate: true });
            }}
          >
            <img
              src={`https://logo.clearbit.com/${company.domain}`}
              alt={`${company.name} logo`}
              className="h-5 w-5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {company.name}
          </Button>
        ))}
      </div>
    </div>
  );
}