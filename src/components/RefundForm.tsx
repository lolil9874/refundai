"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import OffsetButton from "@/components/OffsetButton";
import LiquidGlassButton from "./LiquidGlassButton";
import { toast } from "sonner";
import { CompanySelector } from "./CompanySelector";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { OrderDetailsForm } from "./OrderDetailsForm";
import { IssueSelector } from "./IssueSelector";
import { DescriptionField } from "./DescriptionField";
import { ToneSlider } from "./ToneSlider";
import { ImageUpload } from "./ImageUpload";
import { Loader2 } from "lucide-react";

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

export type RefundFormValues = z.infer<typeof formSchema>;

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
];

export function RefundForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: RefundFormValues) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  const methods = useForm<RefundFormValues>({
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

  const { handleSubmit, reset } = methods;
  const isUploading = isLoading;

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
    reset(values);
    toast.info(t("refundForm.testFillToast"));
    requestAnimationFrame(() => handleSubmit(onSubmit)());
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">{t("refundForm.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("refundForm.subtitle")}</p>
      </div>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>
                {t("refundForm.companySectionTitle")} &amp; {t("refundForm.personalInfoSectionTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <CompanySelector />
              <PersonalInfoForm />
            </CardContent>
          </Card>

          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>{t("refundForm.orderDetailsSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrderDetailsForm />
              <IssueSelector />
              <DescriptionField />
              <ToneSlider />
              <ImageUpload isLoading={isUploading} />
            </CardContent>
          </Card>

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
            onClick={fillAndGenerate}
            disabled={isUploading}
          >
            {t("refundForm.testFillButton")}
          </LiquidGlassButton>
        </form>
      </FormProvider>
    </div>
  );
}