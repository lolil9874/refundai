import { supabase as supabaseClient } from "@/lib/supabase";

export type GenerateRefundPayload = {
  companyDomain: string;
  companyDisplayName: string;
  locale: "en" | "fr";
  country: string;
  firstName: string;
  lastName: string;
  productName: string;
  productValue?: number;
  currency?: string;
  orderNumber: string;
  purchaseDateISO: string;
  issueCategory: "product" | "service" | "subscription";
  issueType: string;
  description: string;
  tone: number;
  hasImage: boolean;
};

export type GenerateRefundResponse = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
  phones: string[];
  premiumContacts?: { phoneMasked?: string }[];
  companyDisplayName: string;
  countryCode: string;
};

const FN_NAME = "generate-refund";

function buildFunctionsUrl(baseUrl: string, fnName: string) {
  return `${baseUrl.replace(/\/+$/, "")}/functions/v1/${fnName}`;
}

function getEnvOptional(name: string): string | undefined {
  const val = (import.meta as any).env?.[name];
  return typeof val === "string" && val.trim().length > 0 ? String(val) : undefined;
}

export async function generateRefund(payload: GenerateRefundPayload): Promise<GenerateRefundResponse> {
  const supabase = supabaseClient;
  const baseUrl = getEnvOptional("VITE_SUPABASE_URL");
  const anonKey = getEnvOptional("VITE_SUPABASE_ANON_KEY");

  // Prefer the Supabase SDK if it's initialized
  if (supabase) {
    const { data, error } = await supabase.functions.invoke<GenerateRefundResponse>(FN_NAME, {
      body: payload,
    });

    if (error) {
      const functionErrorMessage = (error as any)?.context?.body?.error || error.message;
      throw new Error(functionErrorMessage);
    }
    if (data) {
      return data;
    }
  }

  // Fallback to a direct fetch call if the SDK isn't ready
  if (baseUrl && anonKey) {
    const url = buildFunctionsUrl(baseUrl, FN_NAME);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(payload),
    });


    const responseBody = await res.json();
    if (!res.ok) {
      const errorMessage = responseBody?.error || `Request failed with status ${res.status}`;
      throw new Error(errorMessage);
    }
    return responseBody;
  }

  throw new Error("Supabase client is not configured. Please check your .env file and restart the server.");
}