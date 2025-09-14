"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOCR } from "@/hooks/useOCR";
import { Loader2, CheckCircle } from "lucide-react";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { extractTextFromFile, isExtracting, parsedData } = useOCR();

  // Auto-fill form when parsed data is available
  React.useEffect(() => {
    if (parsedData) {
      const { setValue } = form;

      // Auto-fill company
      if (parsedData.company) {
        setValue("company", parsedData.company, { shouldValidate: true });
      } else if (parsedData.otherCompany) {
        setValue("company", parsedData.otherCompany, { shouldValidate: true });
      }

      // Auto-fill product info
      if (parsedData.productName) {
        setValue("productName", parsedData.productName);
      }

      if (parsedData.productValue) {
        setValue("productValue", parsedData.productValue);
      }

      if (parsedData.currency) {
        setValue("currency", parsedData.currency);
      }

      if (parsedData.orderNumber) {
        setValue("orderNumber", parsedData.orderNumber);
      }

      if (parsedData.purchaseDate) {
        const date = new Date(parsedData.purchaseDate);
        if (!isNaN(date.getTime())) {
          setValue("purchaseDate", date);
        }
      }

      // Auto-fill personal info if available
      if (parsedData.firstName) {
        setValue("firstName", parsedData.firstName);
      }

      if (parsedData.lastName) {
        setValue("lastName", parsedData.lastName);
      }

      // Auto-fill issue info
      if (parsedData.issueType) {
        setValue("issueType", parsedData.issueType);
      }

      if (parsedData.description) {
        setValue("description", parsedData.description);
      }
    }
  }, [parsedData, form]);

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FormLabel>{t("refundForm.imageLabel")}</FormLabel>
          <FormControl>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await extractTextFromFile(file);
                  onChange(file);
                }
              }}
              disabled={isLoading || isExtracting}
              {...rest}
            />
          </FormControl>
          <FormDescription>
            {t("refundForm.imageDescription")}
            {isExtracting && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting and parsing text... This may take a moment.
              </div>
            )}
          </FormDescription>
          <FormMessage />

          {parsedData && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-md animate-in fade-in duration-300">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">{t("refundForm.ocrSuccess")}</p>
            </div>
          )}
        </FormItem>
      )}
    />
  );
}