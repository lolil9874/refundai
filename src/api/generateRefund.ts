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

const FN_NAME = "generate-refund";

function getEnv(name: string): string {
  const val = (import.meta as any).env?.[name];
  if (!val) {
    throw new Error(`${name} is not set. Please configure it in your environment (.env) and restart the app.`);
  }
  return String(val);
}

function buildFunctionsUrl(baseUrl: string, fnName: string) {
  return `${baseUrl.replace(/\/+$/, "")}/functions/v1/${fnName}`;
}

export async function generateRefund(payload: GenerateRefundPayload): Promise<GenerateRefundResponse> {
  // Ensure client is configured (validates env presence too)
  const supabase = ensureSupabaseConfigured();

  // 1) Try official SDK invoke
  try {
    const { data, error } = await supabase.functions.invoke<GenerateRefundResponse>(FN_NAME, {
      body: payload,
    });

    if (error) {
      // Function responded but with an error (e.g., missing OPENAI_API_KEY on server)
      const msg = error.message || "Edge Function returned an error.";
      throw new Error(msg);
    }
    if (!data) {
      throw new Error("Edge Function returned no data.");
    }
    return data;
  } catch (sdkErr: any) {
    // 2) Fallback: direct fetch to the Functions endpoint with anon key headers
    const baseUrl = getEnv("VITE_SUPABASE_URL");
    const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
    const url = buildFunctionsUrl(baseUrl, FN_NAME);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Required by Supabase Functions
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Common helpful hints:
      // - 401/403: anon key invalid
      // - 404: function not deployed or wrong name
      // - 500: server error (often OPENAI_API_KEY missing on function)
      throw new Error(
        `Edge Function HTTP ${res.status} at ${url}. ${text || "No response body."}`,
      );
    }

    const data = (await res.json()) as GenerateRefundResponse;
    if (!data) {
      throw new Error("Edge Function returned empty JSON.");
    }
    return data;
  }
}