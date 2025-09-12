// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/* Supabase Edge Function: generate-refund */

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
  meta?: {
    traceId: string;
    timings: {
      totalMs: number;
      openAIMs: number;
    };
    received: Record<string, unknown>;
    openai?: {
      model: string;
      jsonMode: boolean;
      parsed: boolean;
      subjectLen: number;
      bodyLen: number;
    };
  };
};

type ChatMessage = { role: "system" | "user"; content: string };

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
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
      return [
        { phoneMasked: "+33 •• •• •• •• 89" },
        { phoneMasked: "+33 •• •• •• •• 12" },
      ];
    case "US":
    case "CA":
      return [
        { phoneMasked: "+1 ••• ••• ••01" },
        { phoneMasked: "+1 ••• ••• ••22" },
      ];
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
  return new Intl.DateTimeFormat(loc, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatCurrency(value: number | undefined, locale: "en" | "fr"): string {
  if (value === undefined || value === null) return "";
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(
    value,
  );
}

function buildMessages(
  input: GenerateRefundInput,
  formattedDate: string,
  formattedValue: string,
): ChatMessage[] {
  const style = mapToneToStyle(input.tone);
  const language = input.locale;

  const system = `
You are a Customer Service assistant specialized in writing refund request emails for consumers.
Objectives:
- Maximize the chance of response and refund while staying polite, professional, and precise.
- Output MUST be in the target language and ONLY as JSON with two fields: "subject" and "body".
- Do not invent data; use only the provided information.
- No legal threats or internal references that were not provided.
Language:
- Target language: ${language}.
Tone:
- Style: ${style}. (0–33 empathic, 34–66 formal, 67–100 firm)
Content requirements:
- Include order context: product, value, order number, purchase date (already localized).
- Include the issue category and specific reason (already human-readable).
- Make a clear refund request or appropriate resolution.
- Mention that evidence can be provided upon request (if hasImage is true, remind politely that a screenshot is available).
- Use short paragraphs and optionally 3–5 bullet points for facts.
- Keep the subject concise (~70–90 chars), informative, without excessive capitalization.
Output:
- JSON only, exactly: {"subject":"...","body":"..."}
No extra keys, no preamble, no code fences.`;

  const user = `
Data:
- Company: ${input.companyDisplayName} (${input.companyDomain})
- Country: ${input.country}
- First/Last name: ${input.firstName} ${input.lastName}
- Product: ${input.productName}
- Product value (localized): ${formattedValue}
- Order number: ${input.orderNumber}
- Purchase date (localized): ${formattedDate}
- Issue category: ${input.issueCategory}
- Issue type: ${input.issueType}
- Description: ${input.description}
- Has image: ${input.hasImage}
- Tone (0-100): ${input.tone}
- Locale: ${input.locale}

Please return JSON with "subject" and "body" for an email the user will send to the company’s support team in ${language}.`;

  return [
    { role: "system", content: system.trim() },
    { role: "user", content: user.trim() },
  ];
}

function tryParseJSONObject(raw: string): { subject?: string; body?: string } {
  // Remove common code fences if present
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: extract the first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        // ignore
      }
    }
    throw new Error("Failed to parse OpenAI JSON output.");
  }
}

async function generateWithOpenAI(messages: ChatMessage[]): Promise<{
  subject: string;
  body: string;
  chars: number;
  parsed: boolean;
}> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please add it as a secret in your Supabase project.",
    );
  }

  const model = "gpt-4o-mini";

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages,
      // Enforce JSON object response
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} — ${text}`);
  }

  const data = await resp.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";

  // Parse JSON with safety
  const parsed = tryParseJSONObject(content);
  if (!parsed?.subject || !parsed?.body) {
    throw new Error("Invalid OpenAI response structure.");
  }

  const subject = String(parsed.subject).trim();
  const body = String(parsed.body).trim();
  return { subject, body, chars: subject.length + body.length, parsed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const traceId = crypto.randomUUID();
  const startedAt = Date.now();
  console.log(
    `[${traceId}] --- New Request Received --- method=${req.method}`,
  );

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  try {
    const bodyText = await req.text();
    console.log(
      `[${traceId}] Raw request body length: ${bodyText?.length ?? 0}`,
    );

    if (!bodyText) {
      throw new Error("Request body is empty.");
    }

    let input: GenerateRefundInput;
    try {
      input = JSON.parse(bodyText);
    } catch (parseError) {
      console.error(
        `[${traceId}] Failed to parse JSON body:`,
        parseError,
      );
      throw new Error(`Invalid JSON format in request body.`);
    }

    const normDomain = (input.companyDomain || "example.com")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const display = input.companyDisplayName?.trim() || "The Company";
    const locale = input.locale === "fr" ? "fr" : "en";

    const formattedDate = formatDateISOToLocale(input.purchaseDateISO, locale);
    const formattedValue = formatCurrency(input.productValue, locale);

    const { bestEmail, ranked, forms, links } = emailFallbacks(normDomain);
    const phones = getMockPhones(input.country);
    const premiumContacts = getPremiumPhoneMasks(input.country);

    const messages = buildMessages(
      { ...input, companyDomain: normDomain, companyDisplayName: display, locale },
      formattedDate,
      formattedValue,
    );

    console.log(`[${traceId}] Calling OpenAI...`);
    const tOpenAI0 = Date.now();
    const { subject, body, chars, parsed } = await generateWithOpenAI(messages);
    const tOpenAI1 = Date.now();
    console.log(
      `[${traceId}] OpenAI responded. chars=${chars} durationMs=${
        tOpenAI1 - tOpenAI0
      }`,
    );

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
      companyDisplayName: display,
      countryCode: input.country,
      meta: {
        traceId,
        timings: {
          totalMs: Date.now() - startedAt,
          openAIMs: tOpenAI1 - tOpenAI0,
        },
        received: {
          companyDomain: normDomain,
          companyDisplayName: display,
          locale,
          country: input.country,
          issueCategory: input.issueCategory,
          hasImage: input.hasImage,
        },
        openai: {
          model: "gpt-4o-mini",
          jsonMode: true,
          parsed,
          subjectLen: subject.length,
          bodyLen: body.length,
        },
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    console.error(`[${traceId}] Error in generate-refund:`, error);
    return new Response(JSON.stringify({ error: error.message, traceId }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});