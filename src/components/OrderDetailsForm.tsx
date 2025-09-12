"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Comprehensive list of world currencies with their symbols
const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", display: "$USD" },
  { code: "EUR", symbol: "€", name: "Euro", display: "€EUR" },
  { code: "GBP", symbol: "£", name: "British Pound", display: "£GBP" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", display: "¥JPY" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", display: "¥CNY" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", display: "C$CAD" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", display: "A$AUD" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", display: "CHF" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", display: "HK$HKD" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", display: "S$SGD" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", display: "krSEK" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", display: "krNOK" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", display: "krDKK" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty", display: "złPLN" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", display: "KčCZK" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", display: "FtHUF" },
  { code: "RON", symbol: "lei", name: "Romanian Leu", display: "leiRON" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev", display: "лвBGN" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna", display: "knHRK" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", display: "₽RUB" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", display: "₺TRY" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", display: "R$BRL" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", display: "$MXN" },
  { code: "ARS", symbol: "$", name: "Argentine Peso", display: "$ARS" },
  { code: "CLP", symbol: "$", name: "Chilean Peso", display: "$CLP" },
  { code: "COP", symbol: "$", name: "Colombian Peso", display: "$COP" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", display: "S/PEN" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso", display: "$UUYU" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", display: "₩KRW" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", display: "NT$TWD" },
  { code: "THB", symbol: "฿", name: "Thai Baht", display: "฿THB" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", display: "RMMYR" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", display: "RpIDR" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", display: "₱PHP" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", display: "₫VND" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", display: "₹INR" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", display: "₨PKR" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", display: "৳BDT" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", display: "RsLKR" },
  { code: "NPR", symbol: "Rs", name: "Nepalese Rupee", display: "RsNPR" },
  { code: "ZAR", symbol: "R", name: "South African Rand", display: "RZAR" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", display: "₦NGN" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", display: "KShKES" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", display: "₵GHS" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", display: "E£EGP" },
  { code: "MAD", symbol: "DH", name: "Moroccan Dirham", display: "DHMAD" },
  { code: "TND", symbol: "DT", name: "Tunisian Dinar", display: "DTTND" },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar", display: "DADZD" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", display: "₪ILS" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", display: "﷼SAR" },
  { code: "AED", symbol: "DH", name: "UAE Dirham", display: "DHAED" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal", display: "QRQAR" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", display: "KDKWD" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", display: "BDBHD" },
  { code: "OMR", symbol: "RO", name: "Omani Rial", display: "ROOMR" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar", display: "JDJOD" },
  { code: "LBP", symbol: "L£", name: "Lebanese Pound", display: "L£LBP" },
];

const countryCurrencyMap: Record<string, string> = {
  US: "USD", CA: "CAD", FR: "EUR", GB: "GBP", DE: "EUR", ES: "EUR", IT: "EUR",
};

export function OrderDetailsForm() {
  const { t } = useTranslation();
  const form = useFormContext();
  const watchCountry = useWatch({ control: form.control, name: "country" });
  const watchProductValue = useWatch({ control: form.control, name: "productValue" });
  const [open, setOpen] = React.useState(false);

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
          <FormLabel>{t("refundForm.productValueLabel")}</FormLabel>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="productValue"
              render={({ field }) => (
                <FormItem className="flex-1">
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
                <FormItem className="w-24">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-10 px-2 text-sm justify-between"
                        >
                          {field.value 
                            ? currencies.find((currency) => currency.code === field.value)?.display || field.value
                            : t("refundForm.currencyPlaceholder")
                          }
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencies.map((currency) => (
                              <CommandItem
                                key={currency.code}
                                value={currency.code}
                                onSelect={() => {
                                  form.setValue("currency", currency.code);
                                  setOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{currency.display}</span>
                                  <span className="text-muted-foreground text-sm">({currency.name})</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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