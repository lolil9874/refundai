"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import OffsetButton from "@/components/OffsetButton";
import LiquidGlassButton from "@/components/LiquidGlassButton";
import type { RefundFormValues } from "@/components/RefundForm/types";

interface FormActionsProps {
  onTestFill: () => void;
  isUploading: boolean;
  isLoading: boolean;
}

export default function FormActions({ onTestFill, isUploading, isLoading }: FormActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <OffsetButton type="submit" className="w-full text-lg" loading={isUploading} disabled={isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            {t("refundForm.submitButtonLoading")}
          </>
        ) : (
          t("refundForm.submitButton")
        )}
      </OffsetButton>

      <LiquidGlassButton
        type="button"
        className="w-full"
        onClick={onTestFill}
        disabled={isUploading}
      >
        {t("refundForm.testFillButton")}
      </LiquidGlassButton>
    </>
  );
}