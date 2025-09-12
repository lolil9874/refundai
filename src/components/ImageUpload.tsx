"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type Props = {
  isLoading: boolean;
};

export function ImageUpload({ isLoading }: Props) {
  const { t } = useTranslation();
  const form = useFormContext();

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
              accept="image/*"
              onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
              disabled={isLoading}
              {...rest}
            />
          </FormControl>
          <FormDescription>
            {t("refundForm.imageDescription")}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}