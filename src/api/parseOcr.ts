import { supabase as supabaseClient } from "@/lib/supabase";
import { ParsedFormData } from "./types";

export async function parseOcrText(text: string): Promise<ParsedFormData> {
  const supabase = supabaseClient;
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const { data, error } = await supabase.functions.invoke<ParsedFormData>("parse-ocr-text", {
    body: { text },
  });

  if (error) {
    const functionErrorMessage = (error as any)?.context?.body?.error || error.message;
    throw new Error(functionErrorMessage);
  }

  if (!data) {
    throw new Error("No data returned from the parsing function.");
  }

  return data;
}