"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const currencies = [
  { code: "USD", symbol: "🇺🇸 $", name: "USD" },
  { code: "EUR", symbol: "🇪🇺 €", name: "EUR" },
  { code: "GBP", symbol: "🇬🇧 £", name: "GBP" },
  { code: "CAD", symbol: "🇨🇦 CA$", name: "CAD" },
  { code: "CHF", symbol: "🇨🇭 CHF", name: "CHF" },
  { code: "JPY", symbol: "🇯🇵 ¥", name: "JPY" },
  { code: "AUD", symbol: "🇦🇺 A$", name: "AUD" },
];

const countryCurrencyMap: Record<string, string> = {
  US: "USD", CA: "CAD", FR: "EUR", GB: "GBP", DE: "EUR", ES: "EUR", IT: "EUR",
};

export function OrderDetailsForm() {
  const { t } = useTranslation();
  const form = useFormContext();
  const watchCountry = useWatch({ control: form.control, name: "country" });
  const watchProductValue = useWatch({ control: form.control, name: "productValue" });

  // Auto-select currency based on country
  React.useEffect(() => {
    if (watchCountry && !form.getValues("currency")) {
      const defaultCurrency = countryCurrencyMap[watchCountry] || "USD";
      form.setValue("currency", defaultCurrency);
    }
  }, [watchCountry, form]);

  // Hint if value entered but no currency
  React.useEffect(() => {
    if (watchProductValue && watchProductValue > 0 && !form.getValues("currency")) {
      toast.info(t("refundForm.currencyHint"));
    }
  }, [watchProductValue, form, t]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("refundForm.productNameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("refundForm.productNamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="productValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("refundForm.productValueLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("refundForm.productValuePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("refundForm.currencyLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("refundForm.currencyPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("refundForm.orderNumberLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("refundForm.orderNumberPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("refundForm.purchaseDateLabel")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>{t("refundForm.purchaseDatePlaceholder")}</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}