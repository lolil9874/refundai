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

// Comprehensive list of world currencies with their symbols and associated countries
const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", countries: ["United States", "USA"], display: "$USD" },
  { code: "EUR", symbol: "€", name: "Euro", countries: ["Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Austria", "Portugal", "Finland", "Greece", "Ireland", "Luxembourg", "Slovenia", "Cyprus", "Malta", "Slovakia", "Estonia", "Latvia", "Lithuania"], display: "€EUR" },
  { code: "GBP", symbol: "£", name: "British Pound", countries: ["United Kingdom", "UK", "England", "Scotland", "Wales", "Northern Ireland"], display: "£GBP" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", countries: ["Japan"], display: "¥JPY" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", countries: ["China"], display: "¥CNY" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", countries: ["Canada"], display: "C$CAD" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", countries: ["Australia"], display: "A$AUD" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", countries: ["Switzerland"], display: "CHF" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", countries: ["Hong Kong"], display: "HK$HKD" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", countries: ["Singapore"], display: "S$SGD" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", countries: ["Sweden"], display: "krSEK" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", countries: ["Norway"], display: "krNOK" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", countries: ["Denmark"], display: "krDKK" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty", countries: ["Poland"], display: "złPLN" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", countries: ["Czech Republic"], display: "KčCZK" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", countries: ["Hungary"], display: "FtHUF" },
  { code: "RON", symbol: "lei", name: "Romanian Leu", countries: ["Romania"], display: "leiRON" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev", countries: ["Bulgaria"], display: "лвBGN" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna", countries: ["Croatia"], display: "knHRK" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", countries: ["Russia"], display: "₽RUB" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", countries: ["Turkey"], display: "₺TRY" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", countries: ["Brazil"], display: "R$BRL" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", countries: ["Mexico"], display: "$MXN" },
  { code: "ARS", symbol: "$", name: "Argentine Peso", countries: ["Argentina"], display: "$ARS" },
  { code: "CLP", symbol: "$", name: "Chilean Peso", countries: ["Chile"], display: "$CLP" },
  { code: "COP", symbol: "$", name: "Colombian Peso", countries: ["Colombia"], display: "$COP" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", countries: ["Peru"], display: "S/PEN" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso", countries: ["Uruguay"], display: "$UUYU" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", countries: ["South Korea", "Korea"], display: "₩KRW" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", countries: ["Taiwan"], display: "NT$TWD" },
  { code: "THB", symbol: "฿", name: "Thai Baht", countries: ["Thailand"], display: "฿THB" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", countries: ["Malaysia"], display: "RMMYR" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", countries: ["Indonesia"], display: "RpIDR" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", countries: ["Philippines"], display: "₱PHP" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", countries: ["Vietnam"], display: "₫VND" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", countries: ["India"], display: "₹INR" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", countries: ["Pakistan"], display: "₨PKR" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", countries: ["Bangladesh"], display: "৳BDT" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", countries: ["Sri Lanka"], display: "RsLKR" },
  { code: "NPR", symbol: "Rs", name: "Nepalese Rupee", countries: ["Nepal"], display: "RsNPR" },
  { code: "ZAR", symbol: "R", name: "South African Rand", countries: ["South Africa"], display: "RZAR" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", countries: ["Nigeria"], display: "₦NGN" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", countries: ["Kenya"], display: "KShKES" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", countries: ["Ghana"], display: "₵GHS" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", countries: ["Egypt"], display: "E£EGP" },
  { code: "MAD", symbol: "DH", name: "Moroccan Dirham", countries: ["Morocco"], display: "DHMAD" },
  { code: "TND", symbol: "DT", name: "Tunisian Dinar", countries: ["Tunisia"], display: "DTTND" },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar", countries: ["Algeria"], display: "DADZD" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", countries: ["Israel"], display: "₪ILS" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", countries: ["Saudi Arabia"], display: "﷼SAR" },
  { code: "AED", symbol: "DH", name: "UAE Dirham", countries: ["UAE", "Dubai", "Abu Dhabi"], display: "DHAED" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal", countries: ["Qatar"], display: "QRQAR" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", countries: ["Kuwait"], display: "KDKWD" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", countries: ["Bahrain"], display: "BDBHD" },
  { code: "OMR", symbol: "RO", name: "Omani Rial", countries: ["Oman"], display: "ROOMR" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar", countries: ["Jordan"], display: "JDJOD" },
  { code: "LBP", symbol: "L£", name: "Lebanese Pound", countries: ["Lebanon"], display: "L£LBP" },
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

  // Custom filter function for searching - returns number (1 for match, 0 for no match)
  const filterCurrency = (value: string, search: string) => {
    const searchTerm = search.toLowerCase();
    const currency = currencies.find(c => c.code === value);
    if (!currency) return 0;
    
    const matches = 
      currency.code.toLowerCase().includes(searchTerm) ||
      currency.symbol.toLowerCase().includes(searchTerm) ||
      currency.name.toLowerCase().includes(searchTerm) ||
      currency.countries.some(country => country.toLowerCase().includes(searchTerm));
    
    return matches ? 1 : 0;
  };

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
                    <PopoverContent className="w-[350px] p-0">
                      <Command filter={filterCurrency}>
                        <CommandInput placeholder="Search currency or country..." />
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
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-base">{currency.display}</span>
                                    <span className="text-muted-foreground text-sm">({currency.name})</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {currency.countries.slice(0, 3).join(", ")}
                                    {currency.countries.length > 3 && ` +${currency.countries.length - 3} more`}
                                  </div>
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