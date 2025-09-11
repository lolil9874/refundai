import { ensureSupabaseConfigured } from "@/lib/supabase";

export type GenerateRefundPayload = {
  companyDomain: string;
  companyDisplayName: string;
  locale: "en" | "fr";
  country: string;
  firstName: string;
  lastName: string;
  productName: string;
  productValue?: number;
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

export async function generateRefund(payload: GenerateRefundPayload): Promise<GenerateRefundResponse> {
  const supabase = ensureSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<GenerateRefundResponse>("generate-refund", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Failed to invoke generate-refund");
  }
  if (!data) {
    throw new Error("Empty response from generate-refund");
  }
  return data;
}