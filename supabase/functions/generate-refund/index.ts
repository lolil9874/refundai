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
    if (orderNumber) return `Relance concernant la commande n°${orderNumber}`;
    if (productName) return `Relance : Demande de remboursement pour ${productName}`;
    return `Relance : Demande de remboursement auprès de ${companyDisplayName}`;
  }
  if (orderNumber) return `Follow-up regarding Order #${orderNumber}`;
  if (productName) return `Follow-up: Refund request for ${productName}`;
  return `Follow-up: Refund request with ${companyDisplayName}`;
}

function buildSystemPrompt(locale: "en" | "fr", toneStyle: "empathic" | "formal" | "firm") {
  if (locale === "fr") {
    return `Vous êtes un expert en droits des consommateurs et en résolution de litiges. Votre mission est de rédiger le corps d'un e-mail de relance, formel et ferme, pour une demande de remboursement. L'utilisateur a déjà tenté de contacter l'entreprise sans succès.

Votre réponse doit être UNIQUEMENT le corps de l'e-mail.
- Le ton doit être professionnel et assertif, tout en reflétant le style général demandé : ${toneStyle}.
- Faites référence à la politique de remboursement officielle et aux conditions de service de l'entreprise.
- Faites référence aux lois de protection des consommateurs spécifiques et pertinentes pour le pays de l'utilisateur (par exemple, pour la France, mentionnez la "garantie légale de conformité" ; pour le Canada, la Loi sur la protection du consommateur).
- Indiquez clairement qu'il s'agit d'une relance suite à de précédentes tentatives de contact restées sans réponse.
- Exigez une résolution claire (un remboursement complet) et fixez un délai raisonnable pour la réponse de l'entreprise (par ex., 7-10 jours ouvrables).
- N'incluez PAS de ligne "Sujet:".
- Rédigez en français.`;
  }
  return `You are an expert assistant specializing in consumer rights and dispute resolution. Your task is to draft a formal and firm follow-up email for a refund request. The user has already attempted to contact the company with no success.

Your response must be ONLY the body of the email.
- The tone should be professional and assertive, reflecting the user's general choice of tone: ${toneStyle}.
- Reference the company's official refund policy and terms of service.
- Reference specific, relevant consumer protection laws for the user's country (e.g., for the US, mention the Consumer Bill of Rights or state-specific regulations; for the UK, the Consumer Rights Act 2015).
- Clearly state that this is a follow-up to previous, unanswered attempts to resolve the issue.
- Demand a clear resolution (a full refund) and specify a reasonable deadline for the company to respond (e.g., 7-10 business days).
- Do NOT include a "Subject:" line.
- Write in English.`;
}

function buildUserPrompt(
  input: GenerateRefundInput,
  formattedDate: string,
  formattedValue: string,
): string {
  const lang = input.locale;
  if (lang === "fr") {
    return `
Ceci est une demande de relance. Mes précédentes tentatives pour contacter le service client ont été ignorées.

Veuillez rédiger le corps de l'e-mail en vous basant sur ce contexte :
- Société : ${input.companyDisplayName}
- Localisation du client (pour le contexte juridique) : ${input.country}
- Nom du client : ${input.firstName} ${input.lastName}
- Produit/Service : ${input.productName}
- Valeur : ${formattedValue}
- Numéro de commande : ${input.orderNumber}
- Date d'achat : ${formattedDate}
- Catégorie du problème : ${input.issueCategory}
- Motif du remboursement : ${input.issueType}
- Résumé du problème par le client : ${input.description}
${input.hasImage ? "- Note : Je dispose d'un reçu/preuve d'achat en pièce jointe." : ""}

Rappelez-vous d'être ferme et de faire référence à mes droits de consommateur.
`;
  }

  return `
This is a follow-up request. My previous attempts to contact customer service have been ignored.

Please draft the email body based on this context:
- Company: ${input.companyDisplayName}
- Customer's Location (for legal context): ${input.country}
- Customer Name: ${input.firstName} ${input.lastName}
- Product/Service: ${input.productName}
- Value: ${formattedValue}
- Order Number: ${input.orderNumber}
- Purchase Date: ${formattedDate}
- Issue Category: ${input.issueCategory}
- Reason for Refund: ${input.issueType}
- Customer's Summary of the Problem: ${input.description}
${input.hasImage ? "- Note: I have a receipt/proof of purchase available as an attachment." : ""}

Remember to be firm and reference my consumer rights.
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