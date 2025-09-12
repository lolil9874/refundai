"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import OffsetButton from "@/components/OffsetButton";
import { CompanySelector } from "./CompanySelector";
import { CountrySelector } from "./CountrySelector";
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
    country: z.enum(["US", "FR", "GB", "CA", "DE", "ES", "IT"], { required_error: "Country is required." }),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    productName: z.string().min(1, "Product/Service name is required."),
    productValue: z.preprocess((a) => {
      if (a === "" || a === undefined || a === null) return undefined;
      const n = Number(a);
      return Number.isNaN(n) ? undefined : n;
    }, z.number().nonnegative().optional()),
    currency: z.enum(["USD", "EUR", "GBP", "CAD", "CHF", "JPY", "AUD"]).optional(),
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
  )
  .refine(
    (data) => !(data.productValue && data.productValue > 0 && !data.currency),
    {
      message: "Currency is required for the product value.",
      path: ["currency"],
    },
  );

export type RefundFormValues = z.infer<typeof formSchema>;

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
      company: "Amazon",
      country: "US",
      firstName: "",
      lastName: "",
      productName: "",
      orderNumber: "",
      issueCategory: "product",
      description: "",
      tone: 50,
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("refundForm.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t("refundForm.companySectionTitle")}</h3>
              <CompanySelector />
              <CountrySelector />
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t("refundForm.personalInfoSectionTitle")}</h3>
              <PersonalInfoForm />
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t("refundForm.orderDetailsSectionTitle")}</h3>
              <OrderDetailsForm />
            </div>
            <div className="space-y-6">
              <IssueSelector />
              <DescriptionField />
              <ImageUpload isLoading={isLoading} />
              <ToneSlider />
            </div>
            <div className="pt-4">
              <OffsetButton type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("refundForm.submitButtonLoading")}
                  </>
                ) : (
                  t("refundForm.submitButton")
                )}
              </OffsetButton>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}