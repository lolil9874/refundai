import { supabase as supabaseClient } from "@/lib/supabase";

export type OcrExtractedData = {
  company: string | null;
  productName: string | null;
  productValue: number | null;
  orderNumber: string | null;
  purchaseDate: string | null; // ISO date string
};

export type OcrAnalyzePayload = {
  imageBase64: string;
  language: "en" | "fr";
};

export async function ocrAnalyze(payload: OcrAnalyzePayload): Promise<OcrExtractedData> {
  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const FN_NAME = "ocr-analyze";

  const { data, error } = await supabase.functions.invoke<{ success: boolean; data: OcrExtractedData }>(FN_NAME, {
    body: payload,
  });

  if (error) {
    const functionErrorMessage = (error as any)?.context?.body?.error || error.message;
    throw new Error(functionErrorMessage || "OCR analysis failed");
  }

  if (!data || !data.success || !data.data) {
    throw new Error("No data returned from OCR analysis");
  }

  return data.data;
}