"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOCR } from "@/hooks/useOCR";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t, i18n } = useTranslation();
  const form = useFormContext();
  const { extractFromImage, isExtracting, error: ocrError, resetError: resetOcrError } = useOCR(i18n.language);

  const isUploading = isLoading || isExtracting;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetOcrError();
    form.setValue("image", file); // Always attach original file

    if (!isExtracting) {
      const extracted = await extractFromImage(file);
      if (extracted) {
        // Auto-fill matching fields
        if (extracted.company) form.setValue("company", extracted.company);
        if (extracted.productName) form.setValue("productName", extracted.productName);
        if (extracted.productValue !== undefined) form.setValue("productValue", extracted.productValue);
        if (extracted.orderNumber) form.setValue("orderNumber", extracted.orderNumber);
        if (extracted.purchaseDate) form.setValue("purchaseDate", extracted.purchaseDate);
        if (extracted.description) form.setValue("description", extracted.description);

        // UX toast handled in parseText
      }
    }
  };

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FormLabel>{t("refundForm.imageLabel")}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  await handleImageUpload(e);
                  onChange(e.target.files ? e.target.files[0] : null);
                }}
                disabled={isUploading}
                {...rest}
              />
              {isExtracting && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>
            {t("refundForm.imageDescription")}{" "}
            <span className="text-xs text-muted-foreground">
              ({t("ocr.guidance")})
            </span>
          </FormDescription>
          {ocrError && (
            <FormMessage className="text-destructive">
              {ocrError}{" "}
              <Button
                variant="link"
                size="sm"
                onClick={resetOcrError}
                className="h-auto p-0 text-destructive"
              >
                Retry
              </Button>
            </FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}