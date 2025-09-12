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
I'll help you integrate OpenRouter with the nvidia/nemotron-nano-9b-v2:free model to parse OCR text and fill form fields. Let me create the necessary components and update the existing ones.

First, I'll create a new hook for OpenRouter integration:

<dyad-write path="src/hooks/useOpenRouter.ts" description="Hook for OpenRouter API integration">
"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

interface ParsedFormData {
  productName?: string;
  productValue?: number;
  currency?: string;
  orderNumber?: string;
  purchaseDate?: string;
  company?: string;
  otherCompany?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  issueCategory?: string;
  issueType?: string;
  description?: string;
}

export function useOpenRouter() {
  const [isParsing, setIsParsing] = useState(false);
  const form = useFormContext();

  const parseOCRText = async (ocrText: string) => {
    setIsParsing(true);
    const loadingToast = toast.loading("Parsing receipt with AI...");

    try {
      const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "REFUND.AI",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-nano-9b-v2:free",
          messages: [
            {
              role: "system",
              content: `You are a receipt parser for a refund request form. Extract the following information from the OCR text and return it as a JSON object:

{
  "productName": "string or null",
  "productValue": "number or null",
  "currency": "string (USD, EUR, GBP, etc.) or null",
  "orderNumber": "string or null",
  "purchaseDate": "string (YYYY-MM-DD format) or null",
  "company": "string (Amazon, eBay, etc.) or null",
  "otherCompany": "string (domain name) or null",
  "firstName": "string or null",
  "lastName": "string or null",
  "country": "string (US, FR, GB, etc.) or null",
  "issueCategory": "string (product, service, subscription) or null",
  "issueType": "string or null",
  "description": "string or null"
}

Rules:
- Extract only information that is clearly present in the text
- Use null for missing information
- For purchaseDate, convert any date format to YYYY-MM-DD
- For currency, use standard currency codes (USD, EUR, GBP, etc.)
- For country, use ISO country codes (US, FR, GB, etc.)
- For company, use common company names if recognizable
- For issueCategory and issueType, infer from the context if possible
- Return ONLY the JSON object, no other text`
            },
            {
              role: "user",
              content: `Please parse this receipt text:\n\n${ocrText}`
            }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from OpenRouter");
      }

      // Parse the JSON response
      let parsedData: ParsedFormData;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error("Failed to parse OpenRouter response:", content);
        throw new Error("Failed to parse AI response");
      }

      // Update form fields with parsed data
      Object.entries(parsedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === "purchaseDate" && value) {
            // Convert string date to Date object
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              form.setValue(key as any, date);
            }
          } else {
            form.setValue(key as any, value);
          }
        }
      });

      toast.success("Receipt parsed successfully!");
      return parsedData;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("OpenRouter parsing error:", error);
      toast.error(`Failed to parse receipt: ${message}`);
      throw error;
    } finally {
      setIsParsing(false);
      toast.dismiss(loadingToast);
    }
  };

  return { parseOCRText, isParsing };
}