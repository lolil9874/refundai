"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toast as uiToast } from "@/components/ui/use-toast";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import OffsetButton from "@/components/OffsetButton";
import LiquidGlassButton from "@/components/LiquidGlassButton";
import { useOCR } from "@/hooks/useOCR";
import CompanySelector from "@/components/RefundForm/CompanySelector";
import PersonalInfoSection from "@/components/RefundForm/PersonalInfoSection";
import OrderDetailsSection from "@/components/RefundForm/OrderDetailsSection";
import ImageUploadField from "@/components/RefundForm/ImageUploadField";
import FormActions from "@/components/RefundForm/FormActions";

import type { RefundFormValues } from "./types";

const formSchema = z
  .object({
    company: z.string().min(1, "Please select a company or 'Other'."),
    otherCompany: z.string().optional(),
    country: z.string().min(1, "Country is required."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    productName: z.string().min(1, "Product/Service name is required."),
    productValue: z.preprocess((a) => {
      if (a === "" || a === undefined || a === null) return undefined;
      const n = Number(a);
      return Number.isNaN(n) ? undefined : n;
    }, z.number().nonnegative().optional()),
    orderNumber: z.string().min(1, "Order number is required."),
    purchaseDate: z.date({ required_error: "Purchase date is required." }),
    issueCategory: z.enum(["product", "service", "subscription"], {
      required_error: "Please choose a category.",
    }),
    issueType: z.string().min(1, "Issue type is required."),
    description: z.string().min(10, "Please provide a short description (min. 10 characters)."),
    image: z.any().optional(),
    tone: z.number().min(0).max(100),
  })
  .refine(
    (data) => {
      if (data.company === "other") {
        return !!data.otherCompany && data.otherCompany.length > 0;
      }
      return true;
    },
    {
      message: "Please enter the company domain.",
      path: ["otherCompany"],
    },
  );

// Re-export for external use (e.g., Index.tsx)
export { formSchema, type RefundFormValues };

export function RefundForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: RefundFormValues) => void;
  isLoading: boolean;
}) {
  const { t, i18n } = useTranslation();

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      otherCompany: "",
      country: "",
      firstName: "",
      lastName: "",
      productName: "",
      productValue: undefined,
      orderNumber: "",
      purchaseDate: undefined,
      issueCategory: "product",
      issueType: "",
      description: "",
      tone: 50,
    },
  });

  const watchCompany = form.watch("company");
  const watchCategory = form.watch("issueCategory");

  // OCR Integration
  const { extractFromImage, isExtracting, error: ocrError, resetError: resetOcrError } = useOCR(i18n.language);

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

  // Test: Remplir et générer automatiquement
  const fillAndGenerate = () => {
    const values: RefundFormValues = {
      company: "Amazon",
      otherCompany: "",
      country: "US",
      firstName: "John",
      lastName: "Doe",
      productName: "Wireless Headphones",
      productValue: 49.99,
      orderNumber: "123-4567890-1234567",
      purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      issueCategory: "product",
      issueType: t("refundForm.issue.reasons.product.not_received"),
      description:
        "Package never arrived. Tracking shows no movement since dispatch. Requesting a full refund.",
      image: undefined,
      tone: 60,
    };
    form.reset(values);
    toast.info(t("refundForm.testFillToast"));
    requestAnimationFrame(() => form.handleSubmit(onSubmit)());
  };

  const isUploading = isLoading || isExtracting;

  // Handle OCR errors globally
  React.useEffect(() => {
    if (ocrError) {
      uiToast({
        title: t("ocr.error") as string,
        description: ocrError,
        variant: "destructive",
      });
    }
  }, [ocrError, t, uiToast]);

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">{t("refundForm.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("refundForm.subtitle")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Company & Personal Info Card */}
          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>
                {t("refundForm.companySectionTitle")} &amp; {t("refundForm.personalInfoSectionTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <CompanySelector control={form.control} value={watchCompany} />
              <PersonalInfoSection control={form.control} />
            </CardContent>
          </Card>

          {/* Order Details Card */}
          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>{t("refundForm.orderDetailsSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrderDetailsSection
                control={form.control}
                categoryValue={watchCategory}
                language={i18n.language}
              />
              <ImageUploadField
                control={form.control}
                onUpload={handleImageUpload}
                isExtracting={isExtracting}
                isLoading={isLoading}
                ocrError={ocrError}
                resetOcrError={resetOcrError}
              />
            </CardContent>
          </Card>

          <FormActions
            onTestFill={fillAndGenerate}
            isUploading={isUploading}
            isLoading={isLoading}
          />
        </form>
      </Form>
    </div>
  );
}