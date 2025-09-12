// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

type GenerateRefundInput = {
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

function formatCurrency(value: number | undefined, currency: string | undefined, locale: "en" | "fr"): string {
  if (value === undefined || value === null) return "";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(loc, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(value);
  } catch (e) {
    // Fallback for invalid currency code
    return `${value.toFixed(2)} ${currency || ''}`.trim();
  }
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
  if (orderNumber) return `Issue with Order #${orderNumber}`;
  if (productName) return `Refund request — ${productName}`;
  return `Refund request — ${companyDisplayName}`;
}

function buildSystemPrompt(locale: "en" | "fr", toneStyle: "empathic" | "formal" | "firm") {
  if (locale === "fr") {
    return `Vous êtes un assistant expert en service client. Rédigez UNIQUEMENT le corps d'un e-mail de demande de remboursement. Le ton doit être ${toneStyle}, en français, clair, poli et concis. N'incluez PAS de ligne "Sujet:". Ne produisez aucune autre sortie que le corps de l'e-mail.`;
  }
  return `You are an expert customer service assistant. Write ONLY the body of a refund request email. The tone must be ${toneStyle}, in English, clear, polite, and concise. Do NOT include a "Subject:" line. Do not produce any other output besides the email body.`;
}

function buildUserPrompt(
  input: GenerateRefundInput,
  formattedDate: string,
  formattedValue: string,
): string {
  const lang = input.locale;
  if (lang === "fr") {
    return `
Contexte de la demande :
- Société: ${input.companyDisplayName}
- Pays: ${input.country}
- Client: ${input.firstName} ${input.lastName}
- Produit/Service: ${input.productName}
- Valeur: ${formattedValue}
- N° de commande: ${input.orderNumber}
- Date d’achat: ${formattedDate}
- Catégorie du problème: ${input.issueCategory}
- Motif: ${input.issueType}
- Description par le client: ${input.description}
${input.hasImage ? "- Note: une pièce jointe (image/reçu) est disponible." : ""}

Rédigez le corps de l'e-mail que j'enverrai au support client en utilisant ces informations.
`;
  }

  return `
Request context:
- Company: ${input.companyDisplayName}
- Country: ${input.country}
- Customer: ${input.firstName} ${input.lastName}
- Product/Service: ${input.productName}
- Value: ${formattedValue}
- Order number: ${input.orderNumber}
- Purchase date: ${formattedDate}
- Issue Category: ${input.issueCategory}
- Reason: ${input.issueType}
- Customer description: ${input.description}
${input.hasImage ? "- Note: An attachment (image/receipt) is available." : ""}

Write the email body that I will send to customer support using this information.
`;
}

async function generateEmailBodyWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in Supabase secrets.");
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
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
  const text = data.choices?.[0]?.message?.content;

  if (typeof text === "string" && text.trim().length > 0) {
    return text;
  }

  throw new Error("OpenAI returned no usable text output.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const input: GenerateRefundInput = await req.json();

    const companyDomain = (input.companyDomain || "example.com").trim().toLowerCase();
    const companyDisplayName = input.companyDisplayName?.trim() || "The Company";
    const locale: "en" | "fr" = input.locale === "fr" ? "fr" : "en";

    const formattedDate = formatDateISOToLocale(input.purchaseDateISO, locale);
    const formattedValue = formatCurrency(input.productValue, input.currency, locale);

    const { bestEmail, ranked, forms, links } = emailFallbacks(companyDomain);
    const phones = getMockPhones(input.country);
    const premiumContacts = getPremiumPhoneMasks(input.country);

    const toneStyle = mapToneToStyle(input.tone);
    const systemPrompt = buildSystemPrompt(locale, toneStyle);
    const userPrompt = buildUserPrompt(input, formattedDate, formattedValue);

    const body = await generateEmailBodyWithOpenAI(systemPrompt, userPrompt);
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
    console.error("Error in generate-refund:", error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});