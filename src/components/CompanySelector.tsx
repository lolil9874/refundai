"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { popularCompanies } from "@/lib/companies";
import { searchCompanies, type CompanySearchResult } from "@/api/searchCompanies";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function CompanySelector() {
  const { t } = useTranslation();
  const form = useFormContext();
  const companyValue = form.watch("company");
  const debouncedCompanyValue = useDebounce(companyValue, 300);

  const [searchResults, setSearchResults] = React.useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    const performSearch = async () => {
      if (debouncedCompanyValue && debouncedCompanyValue.length > 1) {
        const isPopular = popularCompanies.some(c => c.name.toLowerCase() === debouncedCompanyValue.toLowerCase());
        if (isPopular) {
          setSearchResults([]);
          setIsDropdownOpen(false);
          return;
        }

        setIsLoading(true);
        try {
          const results = await searchCompanies(debouncedCompanyValue);
          setSearchResults(results);
          setIsDropdownOpen(results.length > 0);
        } catch (error) {
          console.error("Failed to search companies:", error);
          setSearchResults([]);
          setIsDropdownOpen(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setIsDropdownOpen(false);
      }
    };

    performSearch();
  }, [debouncedCompanyValue]);

  const handleSelectCompany = (companyName: string) => {
    form.setValue("company", companyName, { shouldValidate: true });
    setIsDropdownOpen(false);
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.companyLabel")}</FormLabel>
            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder={t("refundForm.otherCompanyPlaceholder")}
                      {...field}
                      autoComplete="off"
                    />
                    {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                  </div>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((company) => (
                        <CommandItem
                          key={company.domain}
                          onSelect={() => handleSelectCompany(company.name)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={company.logo} alt={`${company.name} logo`} />
                            <AvatarFallback className="text-[10px] bg-muted">
                              {company.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{company.name}</span>
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

      <div className="flex flex-wrap justify-center gap-2">
        {popularCompanies.map((company) => (
          <Button
            key={company.name}
            type="button"
            variant={companyValue === company.name ? "default" : "outline"}
            className={cn("gap-2", companyValue !== company.name && "bg-white/50 dark:bg-black/20")}
            onClick={() => handleSelectCompany(company.name)}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={`https://logo.clearbit.com/${company.domain}`} alt={`${company.name} logo`} />
              <AvatarFallback className="text-[10px] bg-muted">
                {company.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {company.name}
          </Button>
        ))}
      </div>
    </div>
  );
}