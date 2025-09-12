"use client";

import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { parseISO, isValid, format } from "date-fns";
import { popularCompanies } from "@/lib/companies";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ExtractedData = {
  company?: string;
  productName?: string;
  productValue?: number;
  currency?: "USD" | "EUR" | "GBP" | "CAD" | "CHF" | "JPY" | "AUD";
  orderNumber?: string;
  purchaseDate?: Date;
  description?: string;
  country?: "US" | "FR" | "GB" | "CA" | "DE" | "ES" | "IT";
  confidence?: number; // Average confidence (0-1)
};

type UseOCRReturn = {
  extractFromImage: (file: File) => Promise<ExtractedData | null>;
  isExtracting: boolean;
  error: string | null;
  resetError: () => void;
};

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "CHF", "JPY", "AUD"] as const;
const COUNTRIES = ["US", "FR", "GB", "CA", "DE", "ES", "IT"] as const;

const CURRENCY_SYMBOL_MAP: Record<string, typeof SUPPORTED_CURRENCIES[number]> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  'CA$': 'CAD',
  'CHF': 'CHF',
  'A$': 'AUD',
};

const COUNTRY_KEYWORDS: Record<typeof COUNTRIES[number], string[]> = {
  US: ['usa', 'united states', 'america'],
  FR: ['france', 'français', 'paris'],
  GB: ['uk', 'united kingdom', 'london'],
  CA: ['canada', 'canadien'],
  DE: ['germany', 'deutschland', 'berlin'],
  ES: ['spain', 'españa', 'madrid'],
  IT: ['italy', 'italia', 'rome'],
};

export function useOCR(initialLanguage: string = "en") {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const { t } = useTranslation();

  const resetError = useCallback(() => setError(null), []);

  // Determine language model: 'eng' for English, 'fra' for French, 'eng+fra' for bilingual
  const getLanguage = useCallback(() => {
    const lang = (i18n.language || initialLanguage).split("-")[0];
    return lang === "fr" ? "eng+fra" : "eng"; // Bilingual for FR to cover mixed receipts
  }, [i18n.language, initialLanguage]);

  // Country-currency defaults
  const getDefaultCurrency = useCallback((country?: string) => {
    const defaults: Record<typeof COUNTRIES[number], typeof SUPPORTED_CURRENCIES[number]> = {
      US: 'USD', FR: 'EUR', GB: 'GBP', CA: 'CAD', DE: 'EUR', ES: 'EUR', IT: 'EUR',
    };
    return country ? defaults[country as keyof typeof defaults] || 'USD' : 'USD';
  }, []);

  // Basic regex fallback for parsing (used if DeepSeek fails)
  const parseTextBasic = useCallback((text: string, lang: string): ExtractedData => {
    const normalizedText = text.toLowerCase().replace(/\s+/g, " ").trim();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    let confidence = 0.5; // Default for basic parsing

    // Company
    let company;
    const domainMatch = normalizedText.match(/@?([a-z0-9-]+\.(com|co\.uk|fr|eu|net|org))/i);
    if (domainMatch) {
      const domain = domainMatch[1];
      company = popularCompanies.find((c) => c.domain.includes(domain))?.name || domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    } else {
      const firstLine = lines[0];
      company = popularCompanies.find((c) => firstLine.toLowerCase().includes(c.name.toLowerCase()))?.name;
    }

    // Product Name
    const productName = lines.find((line) => line.length > 10 && !/^\d+/.test(line) && !["total", "montant", "date", "order"].some((kw) => line.toLowerCase().includes(kw))) || "";

    // Product Value + Currency (basic regex)
    let productValue: number | undefined;
    let currency: typeof SUPPORTED_CURRENCIES[number] | undefined;
    const currencyMatch = normalizedText.match(/([€$£¥CA$]?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/);
    if (currencyMatch) {
      const symbol = currencyMatch[1];
      const numStr = currencyMatch[2].replace(/,/g, ''); // Handle thousands
      productValue = parseFloat(numStr.replace(',', '.')); // Decimal
      currency = CURRENCY_SYMBOL_MAP[symbol] || getDefaultCurrency();
    }

    // Order Number
    const orderMatch = normalizedText.match(/(?:order|ref|invoice|commande|facture)[#:\s]*([a-z0-9\-]+)/i);
    const orderNumber = orderMatch ? orderMatch[1].toUpperCase() : "";

    // Purchase Date
    let purchaseDate: Date | undefined;
    const dateMatch = normalizedText.match(/\b(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{2,4})\b/) || normalizedText.match(/\b(\d{4})[\/\-\s](\d{1,2})[\/\-\s](\d{1,2})\b/);
    if (dateMatch) {
      const [, d, m, y] = dateMatch;
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10) < 100 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
      const candidate = lang === "fr" ? new Date(year, month - 1, day) : new Date(year, day - 1, month);
      if (isValid(candidate) && candidate < new Date() && candidate > new Date("1900-01-01")) {
        purchaseDate = candidate;
      }
    }

    // Description
    const descStart = lines.findIndex((line) => line.toLowerCase().includes("issue") || line.toLowerCase().includes("problem") || line.length > 20);
    const description = descStart > -1 ? lines.slice(descStart, descStart + 2).join(". ").trim() : "";

    // Country (basic keyword match)
    let country: typeof COUNTRIES[number] | undefined;
    for (const [code, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
      if (keywords.some(kw => normalizedText.includes(kw))) {
        country = code as typeof COUNTRIES[number];
        break;
      }
    }

    const extracted: ExtractedData = {
      company: company || undefined,
      productName: productName || undefined,
      productValue: productValue || undefined,
      currency: currency || getDefaultCurrency(country),
      orderNumber: orderNumber || undefined,
      purchaseDate: purchaseDate || undefined,
      description: description || undefined,
      country: country || undefined,
      confidence,
    };

    const filledCount = Object.values(extracted).filter(Boolean).length;
    if (filledCount > 2) {
      toast.success(t("ocr.success", { count: filledCount, total: 8 }));
    } else {
      toast.error(t("ocr.noText"));
    }

    return extracted;
  }, [getDefaultCurrency, t]);

  // DeepSeek parsing via OpenRouter (primary method)
  const parseWithDeepSeek = useCallback(async (text: string, lang: string): Promise<ExtractedData> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      toast.warning("DeepSeek unavailable—using basic parsing.");
      return parseTextBasic(text, lang);
    }

    try {
      const prompt = lang === "fr" 
        ? `Extrayez du texte de reçu: company (string), productName (string), productValue (number ou null), currency ("USD"|"EUR" etc. détecter $→USD €→EUR), orderNumber (string), purchaseDate (ISO ou null), description (string), country ("US"|"FR" etc. inférer). JSON seulement.`
        : `Parse receipt text: company (string), productName (string), productValue (number or null), currency ("USD"|"EUR" etc., detect $→USD €→EUR), orderNumber (string), purchaseDate (ISO or null), description (string), country ("US"|"FR" etc., infer). JSON only.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin, // Your app
          "X-Title": "RefundAI Parser",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-distill-llama-70b", // Free DeepSeek
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `Text: ${text}` },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);

      const data = await response.json();
      const jsonStr = data.choices[0]?.message?.content?.trim();
      if (!jsonStr) throw new Error("No JSON response from DeepSeek");

      const parsed = JSON.parse(jsonStr);
      const extracted: ExtractedData = {
        company: parsed.company || undefined,
        productName: parsed.productName || undefined,
        productValue: typeof parsed.productValue === "number" ? parsed.productValue : undefined,
        currency: SUPPORTED_CURRENCIES.includes(parsed.currency) ? parsed.currency : getDefaultCurrency(parsed.country),
        orderNumber: parsed.orderNumber || undefined,
        purchaseDate: parsed.purchaseDate ? parseISO(parsed.purchaseDate) : undefined,
        description: parsed.description || undefined,
        country: COUNTRIES.includes(parsed.country) ? parsed.country : undefined,
        confidence: 0.9, // High for AI parsing
      };

      // Validate date
      if (extracted.purchaseDate && !isValid(extracted.purchaseDate)) {
        extracted.purchaseDate = undefined;
      }

      const filledCount = Object.values(extracted).filter(Boolean).length;
      toast.success(t("ocr.deepseekSuccess", { count: filledCount, total: 8, currency: extracted.currency || "none" }));

      return extracted;
    } catch (err) {
      console.warn("DeepSeek failed, falling back to basic:", err);
      toast.warning(t("ocr.deepseekFallback"));
      return parseTextBasic(text, lang);
    }
  }, [parseTextBasic, getDefaultCurrency, t]);

  // Pre-process image (grayscale + contrast for better OCR)
  const preprocessImage = useCallback((canvas: HTMLCanvasElement): void => {
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg > 128 ? 255 : 0; // Binary threshold
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Handle PDF rendering + OCR
  const ocrFromPdf = useCallback(async (file: File, langModel: string): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    // Use unpkg.com for reliable dynamic version fetching (fixes cdnjs fetch issues in Vite/browser)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // Higher res for text
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;

      preprocessImage(canvas); // Enhance for OCR

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, "image/png"));
      const url = URL.createObjectURL(blob);

      const worker = await createWorker(langModel, 1, { logger: m => console.log(`PDF OCR Page ${pageNum}: ${Math.round(m.progress * 100)}%`) });
      const { data } = await worker.recognize(url);
      fullText += data.text + "\n";
      await worker.terminate();
      URL.revokeObjectURL(url);
    }

    return fullText.trim();
  }, [preprocessImage]);

  // Handle image OCR (non-PDF)
  const ocrFromImage = useCallback(async (file: File, langModel: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        preprocessImage(canvas);

        const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve, "image/png"));
        const url = URL.createObjectURL(blob);

        const worker = await createWorker(langModel, 1, { logger: m => console.log(`Image OCR: ${Math.round(m.progress * 100)}%`) });
        const { data } = await worker.recognize(url);
        await worker.terminate();
        URL.revokeObjectURL(url);
        resolve(data.text);
      };

      img.onerror = () => reject(new Error("Invalid image"));
      img.src = URL.createObjectURL(file);
    });
  }, [preprocessImage]);

  const extractFromImage = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      setError("Please upload an image or PDF file.");
      return null;
    }

    setIsExtracting(true);
    setError(null);
    let fullText = "";

    try {
      const langModel = getLanguage();
      toast.loading(t("ocr.processing", { type: file.type.includes("pdf") ? "PDF" : "image" }));

      if (file.type.includes("pdf")) {
        fullText = await ocrFromPdf(file, langModel);
      } else {
        fullText = await ocrFromImage(file, langModel);
      }

      if (!fullText.trim()) {
        throw new Error("No text detected in file.");
      }

      toast.loading(t("ocr.parsingWithAI"));
      const lang = langModel === "eng+fra" ? "fr" : "en";
      const extracted = await parseWithDeepSeek(fullText, lang);

      return extracted;

    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR processing failed.";
      setError(msg);
      toast.error(t("ocr.error", { message: msg }));
      return null;
    } finally {
      setIsExtracting(false);
      toast.dismiss(); // Clear loading
    }
  }, [getLanguage, ocrFromPdf, ocrFromImage, parseWithDeepSeek, t]);

  return { extractFromImage, isExtracting, error, resetError };
}