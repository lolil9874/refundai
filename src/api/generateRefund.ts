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

// Helpers for local fallback

function normalizeDomain(raw: string) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function emailFallbacks(domain: string) {
  const d = normalizeDomain(domain);
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

function buildLocalEmail(payload: GenerateRefundPayload) {
  const date = formatDateISOToLocale(payload.purchaseDateISO, payload.locale);
  const value = formatCurrency(payload.productValue, payload.locale);

  if (payload.locale === "fr") {
    const subject = `Problème avec la commande n°${payload.orderNumber}`;
    const body = [
      `Bonjour l'équipe ${payload.companyDisplayName},`,
      ``,
      `Je vous contacte au sujet d'un problème avec ma récente commande.`,
      ``,
      `Détails de la commande :`,
      `- Produit : ${payload.productName}`,
      value ? `- Valeur du produit : ${value}` : undefined,
      `- Numéro de commande : ${payload.orderNumber}`,
      `- Date d'achat : ${date}`,
      ``,
      `Catégorie du problème : ${payload.issueCategory}`,
      `Motif : ${payload.issueType}`,
      ``,
      payload.description,
      ``,
      payload.hasImage
        ? `Je peux fournir une capture d'écran/une preuve sur demande.`
        : `Je peux fournir des informations supplémentaires si nécessaire.`,
      ``,
      `Je vous remercie par avance pour votre aide et reste dans l'attente de votre retour.`,
      ``,
      `Cordialement,`,
      `${payload.firstName} ${payload.lastName}`,
    ]
      .filter(Boolean)
      .join("\n");
    return { subject, body };
  }

  // English
  const subject = `Issue with Order #${payload.orderNumber}`;
  const body = [
    `Hello ${payload.companyDisplayName} Team,`,
    ``,
    `I'm contacting you regarding an issue with my recent order.`,
    ``,
    `Order details:`,
    `- Product: ${payload.productName}`,
    value ? `- Product value: ${value}` : undefined,
    `- Order number: ${payload.orderNumber}`,
    `- Purchase date: ${date}`,
    ``,
    `Issue category: ${payload.issueCategory}`,
    `Reason: ${payload.issueType}`,
    ``,
    payload.description,
    ``,
    payload.hasImage
      ? `I can provide a screenshot/evidence upon request.`
      : `I'm happy to provide any additional information if needed.`,
    ``,
    `Thank you for your help. I look forward to your response.`,
    ``,
    `Sincerely,`,
    `${payload.firstName} ${payload.lastName}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, body };
}

function buildFunctionsUrl(baseUrl: string, fnName: string) {
  return `${baseUrl.replace(/\/+$/, "")}/functions/v1/${fnName}`;
}

function getEnvOptional(name: string): string | undefined {
  const val = (import.meta as any).env?.[name];
  return typeof val === "string" && val.trim().length > 0 ? String(val) : undefined;
}

export async function generateRefund(payload: GenerateRefundPayload): Promise<GenerateRefundResponse> {
  // 1) Try Supabase SDK if configured
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.functions.invoke<GenerateRefundResponse>(FN_NAME, {
        body: payload,
      });

      if (!error && data) {
        return data;
      }
      // If the function responded with an error, continue to next strategy
      console.warn("Supabase SDK invoke returned error/data:", error, data);
    } catch (e) {
      console.warn("Supabase SDK invoke failed, will try direct fetch.", e);
    }
  }

  // 2) Try direct fetch if env vars exist
  const baseUrl = getEnvOptional("VITE_SUPABASE_URL");
  const anonKey = getEnvOptional("VITE_SUPABASE_ANON_KEY");

  if (baseUrl && anonKey) {
    const url = buildFunctionsUrl(baseUrl, FN_NAME);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = (await res.json()) as GenerateRefundResponse;
        if (data) return data;
      } else {
        const text = await res.text().catch(() => "");
        console.warn(`Edge Function HTTP ${res.status} at ${url}. ${text || "No response body."}`);
      }
    } catch (e) {
      console.warn("Direct fetch to Edge Function failed, will use local fallback.", e);
    }
  } else {
    console.warn("Supabase env vars not set or invalid; using local fallback.");
  }

  // 3) Local fallback to keep the app usable
  const domain = normalizeDomain(payload.companyDomain || "example.com");
  const { bestEmail, ranked, forms, links } = emailFallbacks(domain);
  const phones = getMockPhones(payload.country);
  const premiumContacts = getPremiumPhoneMasks(payload.country);
  const { subject, body } = buildLocalEmail(payload);

  return {
    bestEmail,
    ranked,
    forms,
    links,
    subject,
    body,
    hasImage: payload.hasImage,
    phones,
    premiumContacts,
    companyDisplayName: payload.companyDisplayName || "The Company",
    countryCode: payload.country,
  };
}