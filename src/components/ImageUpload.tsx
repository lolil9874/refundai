"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useOCR } from "@/hooks/useOCR";
import { Loader2, CheckCircle } from "lucide-react";
import { ParsedFormData } from "@/api/types";
import { CustomFileInput } from "./CustomFileInput";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { extractTextFromFile, isExtracting, parsedData } = useOCR();
  const appliedDataRef = React.useRef<ParsedFormData | null>(null);

  // Auto-fill form when new parsed data is available
  React.useEffect(() => {
    // Only apply new data. This prevents re-applying on every render,
    // which was causing the form to freeze and overwrite user edits.
    if (parsedData && parsedData !== appliedDataRef.current) {
      const { setValue } = form;

      // Auto-fill company
      if (parsedData.company) {
        setValue("company", parsedData.company, { shouldValidate: true });
      } else if (parsedData.otherCompany) {
        setValue("company", parsedData.otherCompany, { shouldValidate: true });
      }

      // Auto-fill product info
      if (parsedData.productName) {
        setValue("productName", parsedData.productName, { shouldValidate: true });
      }

      if (parsedData.productValue) {
        setValue("productValue", parsedData.productValue, { shouldValidate: true });
      }

      if (parsedData.currency) {
        setValue("currency", parsedData.currency, { shouldValidate: true });
      }

      if (parsedData.orderNumber) {
        setValue("orderNumber", parsedData.orderNumber, { shouldValidate: true });
      }

      if (parsedData.purchaseDate) {
        const date = new Date(parsedData.purchaseDate);
        if (!isNaN(date.getTime())) {
          setValue("purchaseDate", date, { shouldValidate: true });
        }
      }

      // Auto-fill personal info if available
      if (parsedData.firstName) {
        setValue("firstName", parsedData.firstName, { shouldValidate: true });
      }

      if (parsedData.lastName) {
        setValue("lastName", parsedData.lastName, { shouldValidate: true });
      }

      // Auto-fill issue info
      if (parsedData.issueType) {
        setValue("issueType", parsedData.issueType, { shouldValidate: true });
      }

      if (parsedData.description) {
        setValue("description", parsedData.description, { shouldValidate: true });
      }

      // Mark this data as applied to prevent re-application
      appliedDataRef.current = parsedData;
    }
  }, [parsedData, form]);

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field: { onChange, value, onBlur, name } }) => (
        <FormItem>
          <FormLabel>{t("refundForm.imageLabel")}</FormLabel>
          <FormControl>
            <CustomFileInput
              accept="image/*,application/pdf"
              onChange={async (file) => {
                if (file) {
                  // When a new file is uploaded, reset the applied data ref
                  // so that the new OCR results can be applied.
                  appliedDataRef.current = null;
                  await extractTextFromFile(file);
                  onChange(file);
                } else {
                  onChange(null);
                }
              }}
              value={value}
              onBlur={onBlur}
              name={name}
              disabled={isLoading || isExtracting}
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

          {parsedData && appliedDataRef.current === parsedData && (
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