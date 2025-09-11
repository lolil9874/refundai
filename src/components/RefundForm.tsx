"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { popularCompanies } from "@/lib/companies";
import OffsetButton from "@/components/OffsetButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

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
    issueCategory: z.enum(["product", "service"], { required_error: "Please choose a category." }),
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

  const productReasons = [
    t("refundForm.issue.reasons.product.not_received"),
    t("refundForm.issue.reasons.product.late_delivery"),
    t("refundForm.issue.reasons.product.wrong_or_not_as_described"),
    t("refundForm.issue.reasons.product.damaged_or_defective"),
    t("refundForm.issue.reasons.product.other"),
  ];
  const serviceReasons = [
    t("refundForm.issue.reasons.service.not_provided"),
    t("refundForm.issue.reasons.service.delayed_or_rescheduled"),
    t("refundForm.issue.reasons.service.not_as_described_or_poor_quality"),
    t("refundForm.issue.reasons.service.access_issues"),
    t("refundForm.issue.reasons.service.other"),
  ];

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
  const watchTone = form.watch("tone");
  const currentReasons = watchCategory === "service" ? serviceReasons : productReasons;

  React.useEffect(() => {
    form.setValue("issueType", "");
  }, [watchCategory]);

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

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">{t("refundForm.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("refundForm.subtitle")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... existing cards and fields unchanged ... */}

          <OffsetButton
            type="submit"
            className="w-full text-lg"
            loading={isLoading}
            disabled={isLoading}
            shineText
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {t("refundForm.submitButtonLoading")}
              </>
            ) : (
              t("refundForm.submitButton")
            )}
          </OffsetButton>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={fillAndGenerate}
            disabled={isLoading}
          >
            {t("refundForm.testFillButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}