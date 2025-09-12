"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOCR } from "@/hooks/useOCR";
import { Loader2 } from "lucide-react";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { autoFillFromFile, isExtracting } = useOCR();

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
                  await autoFillFromFile(file);
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
                Extracting details from your receipt...
              </div>
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}