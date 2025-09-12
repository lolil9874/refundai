"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOCR, type ExtractedData } from "@/hooks/useOCR";
import { toast } from "sonner";

type Props = {
  isLoading: boolean;
  setFormValue?: (name: string, value: any) => void; // From useForm
};

export function ImageUpload({ isLoading, setFormValue }: Props) {
  const { t, i18n } = useTranslation();
  const form = useFormContext();
  const { extractFromImage, isExtracting, error: ocrError, resetError: resetOcrError } = useOCR(i18n.language);

  const isUploading = isLoading || isExtracting;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetOcrError();
    form.setValue("image", file); // Always attach original file

    if (!isExtracting && setFormValue) {
      const extracted = await extractFromImage(file);
      if (extracted) {
        // Auto-fill all fields from OCR + DeepSeek
        if (extracted.company) setFormValue("company", extracted.company);
        if (extracted.productName) setFormValue("productName", extracted.productName);
        if (extracted.productValue !== undefined) setFormValue("productValue", extracted.productValue);
        if (extracted.currency) setFormValue("currency", extracted.currency);
        if (extracted.orderNumber) setFormValue("orderNumber", extracted.orderNumber);
        if (extracted.purchaseDate) setFormValue("purchaseDate", extracted.purchaseDate);
        if (extracted.description) setFormValue("description", extracted.description);
        if (extracted.country) setFormValue("country", extracted.country);

        // UX: Currency-specific toast if detected
        if (extracted.currency) {
          toast.success(t("ocr.currencyDetected", { currency: extracted.currency }));
        }
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
                accept="image/*,application/pdf"
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
                {t("ocr.retry")}
              </Button>
            </FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}