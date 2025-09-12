"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RefundFormValues } from "@/components/RefundForm/types";

interface ImageUploadFieldProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isExtracting: boolean;
  isLoading: boolean;
  ocrError: string | null;
  resetOcrError: () => void;
  control: any; // From useForm
}

export default function ImageUploadField({
  onUpload,
  isExtracting,
  isLoading,
  ocrError,
  resetOcrError,
  control,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const isUploading = isLoading || isExtracting;

  return (
    <FormField
      control={control}
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
                  await onUpload(e);
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