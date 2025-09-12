// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/* Supabase Edge Function: generate-refund (Responses API - Step A)
   - Minimal migration to the Responses API (same pattern as test-openai).
   - Uses model gpt-5-nano-2025-08-07 with { instructions, input }.
   - No Structured Outputs yet; we parse output_text and return it as the email body.
   - Subject is generated locally as a simple, localized fallback.
*/

type GenerateRefundInput = {
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

type GenerateRefundResult = {
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

type ChatMessage = { role: "system" | "user"; content: string };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function emailFallbacks(domain: string) {
  const d = domain.toLowerCase();
  const base = [
    `support@${d}`,
    `help@${d}`,
    `refunds@${d}`,
    `contact@${d}`,
    `customerservice@${d}`,
  ];
  return {
    bestEmail: base[0],
    ranked: base.slice(1),
    forms: [`https://www.${d}/contact`],
    links: [] as string[],
  };
}

function getMockPhones(country: string): string[] {
  switch (country) {
    case "US":
    case "CA":
      return ["+1 800 123 4567", "+1 415 555 0101"];
    case "FR":
      return ["+33 1 23 45 67 89", "+33 9 70 00 00 00"];
    case "GB":
      return ["+44 20 1234 5678"];
    case "DE":
      return ["+49 30 123456"];
    case "ES":
      return ["+34 91 123 45 67"];
    case "IT":
      return ["+39 02 1234 5678"];
    default:
      return ["+1 800 000 0000"];
  }
}

function getPremiumPhoneMasks(country: string): { phoneMasked?: string }[] {
  switch (country) {
    case "FR":
      return [{ phoneMasked: "+33 •• •• •• •• 89" }, { phoneMasked: "+33 •• •• •• •• 12" }];
    case "US":
    case "CA":
      return [{ phoneMasked: "+1 ••• ••• ••01" }, { phoneMasked: "+1 ••• ••• ••22" }];
    default:
      return [{ phoneMasked: "+44 •• •• •• •• 78" }];
  }
}

function mapToneToStyle(tone: number): "empathic" | "formal" | "firm" {
  if (tone <= 33) return "empathic";
  if (tone <= 66) return "formal";
  return "firm";
}

function formatDateISOToLocale(iso: string, locale: "en" | "fr"): string {
  const date = new Date(iso);
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.DateTimeFormat(loc, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function formatCurrency(value: number | undefined, locale: "en" | "fr"): string {
  if (value === undefined || value === null) return "";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(value);
}

function makeFallbackSubject(
  locale: "en" | "fr",
  companyDisplayName: string,
  productName?: string,
  orderNumber?: string,
): string {
  if (locale === "fr") {
    if (orderNumber) return `Problème avec la commande n°${orderNumber}`;
    if (productName) return `Demande de remboursement — ${productName}`;
    return `Demande de remboursement — ${companyDisplayName}`;
  }
  // en
  if (orderNumber) return `Issue with Order #${orderNumber}`;
  if (productName) return `Refund request — ${productName}`;
  return `Refund request — ${companyDisplayName}`;
}

function buildInstructions(locale: "en" | "fr", toneStyle: "empathic" | "formal" | "firm") {
  if (locale === "fr") {
    return `Vous êtes un assistant de service client. Rédigez UNIQUEMENT le corps d’un e-mail de demande de remboursement, en ${toneStyle} et en français, clair, poli et concis. Pas d’en-tête "Sujet:". Pas d’autres sorties.`;
  }
  return `You are a customer service assistant. Write ONLY the body of a refund request email in a ${toneStyle} tone, in English, clear, polite, and concise. Do not include a "Subject:" line. No extra output.`;
}

function buildInput(
  input: GenerateRefundInput,
  formattedDate: string,
  formattedValue: string,
): string {
  const lang = input.locale;
  if (lang === "fr") {
    return [
      `Contexte:`,
      `- Société: ${input.companyDisplayName} (${input.companyDomain})`,
      `- Pays: ${input.country}`,
      `- Nom: ${input.firstName} ${input.lastName}`,
      `- Produit/Service: ${input.productName}`,
      `- Valeur: ${formattedValue}`,
      `- N° de commande: ${input.orderNumber}`,
      `- Date d’achat/prestation: ${formattedDate}`,
      `- Catégorie: ${input.issueCategory}`,
      `- Motif: ${input.issueType}`,
      `- Description courte: ${input.description}`,
      input.hasImage ? `- Note: une capture d’écran est disponible.` : ``,
      ``,
      `Rédigez le corps de l’e-mail que j’enverrai au support.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Context:`,
    `- Company: ${input.companyDisplayName} (${input.companyDomain})`,
    `- Country: ${input.country}`,
    `- Name: ${input.firstName} ${input.lastName}`,
    `- Product/Service: ${input.productName}`,
    `- Value: ${formattedValue}`,
    `- Order number: ${input.orderNumber}`,
    `- Purchase/Service date: ${formattedDate}`,
    `- Category: ${input.issueCategory}`,
    `- Issue: ${input.issueType}`,
    `- Short description: ${input.description}`,
    input.hasImage ? `- Note: a screenshot is available.` : ``,
    ``,
    `Write the email body that I will send to support.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateEmailBodyWithOpenAI(
  instructions: string,
  input: string,
): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
  }

  const payload = {
    model: "gpt-5-nano-2025-08-07",
    instructions,
    input,
    store: false,
  };

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} — ${text}`);
  }

  const data = await resp.json();

  // Same extraction style as test-openai
  const messageItem = data?.output?.find((item: any) => item.type === "message");
  const outputTextItem = messageItem?.content?.find((item: any) => item.type === "output_text");
  const text = outputTextItem?.text;

  if (typeof text === "string" && text.trim().length > 0) {
    return text;
  }

  // Fallback to helper if present
  if (typeof data?.output_text === "string" && data.output_text.trim().length > 0) {
    return data.output_text;
  }

  throw new Error("OpenAI returned no usable text output.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText) throw new Error("Request body is empty.");

    let input: GenerateRefundInput;
    try {
      input = JSON.parse(bodyText);
    } catch {
      throw new Error(`Invalid JSON format in request body.`);
    }

    const companyDomain = (input.companyDomain || "example.com")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const companyDisplayName = input.companyDisplayName?.trim() || "The Company";
    const locale: "en" | "fr" = input.locale === "fr" ? "fr" : "en";

    const formattedDate = formatDateISOToLocale(input.purchaseDateISO, locale);
    const formattedValue = formatCurrency(input.productValue, locale);

    const { bestEmail, ranked, forms, links } = emailFallbacks(companyDomain);
    const phones = getMockPhones(input.country);
    const premiumContacts = getPremiumPhoneMasks(input.country);

    const toneStyle = mapToneToStyle(input.tone);
    const instructions = buildInstructions(locale, toneStyle);
    const promptInput = buildInput({ ...input, companyDomain, companyDisplayName, locale }, formattedDate, formattedValue);

    const body = await generateEmailBodyWithOpenAI(instructions, promptInput);
    const subject = makeFallbackSubject(locale, companyDisplayName, input.productName, input.orderNumber);

    const payload: GenerateRefundResult = {
      bestEmail,
      ranked,
      forms,
      links,
      subject,
      body,
      hasImage: input.hasImage,
      phones,
      premiumContacts,
      companyDisplayName,
      countryCode: input.country,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});