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
import { IssueI'll help you integrate OpenRouter with the nvidia/nemotron-nano-9b-v2:free model to parse OCR text and fill form fields. Let me create the necessary components and update the existing ones.

First, I need to add the OpenAI dependency and create a service for OpenRouter:

<dyad-add-dependency packages="openai"></dyad-add-dependency>

Now, let me create a service for OpenRouter integration:

<dyad-write path="src/services/openrouter.ts" description="OpenRouter service for LLM integration">
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  dangerouslyAllowBrowser: true, // Allow browser usage
});

export interface ParsedFormData {
  productName?: string;
  productValue?: number;
  currency?: string;
  orderNumber?: string;
  purchaseDate?: string;
  company?: string;
  otherCompany?: string;
  firstName?: string;
  lastName?: string;
  issueType?: string;
  description?: string;
}

export async function parseOCRTextWithLLM(ocrText: string): Promise<ParsedFormData> {
  try {
    const completion = await openrouter.chat.completions.create({
      model: 'nvidia/nemotron-nano-9b-v2:free',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting structured information from receipts, invoices, and order confirmations. 
          Extract the following information and return it as a JSON object:
          - productName: Name of the product or service
          - productValue: Numeric value of the product (just the number)
          - currency: Currency code (USD, EUR, GBP, etc.)
          - orderNumber: Order or transaction number
          - purchaseDate: Date in YYYY-MM-DD format
          - company: Company name (if it's a known company like Amazon, Walmart, etc.)
          - otherCompany: Company domain if not a known company
          - firstName: Customer first name if present
          - lastName: Customer last name if present
          - issueType: Type of issue if mentioned (e.g., "damaged", "not received", "wrong item")
          - description: Brief description of any issues mentioned

          If a field is not found, omit it from the JSON. Return only valid JSON.`
        },
        {
          role: 'user',
          content: `Extract information from this text:\n\n${ocrText}`
        }
      ],
      extra_headers: {
        'HTTP-Referer': 'https://refundai.app',
        'X-Title': 'RefundAI',
      },
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from LLM');
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', response);
      throw new Error('Invalid JSON response from LLM');
    }
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}