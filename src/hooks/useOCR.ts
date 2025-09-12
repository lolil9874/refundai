"use client";

import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { parseISO, isValid, format } from "date-fns";
import { popularCompanies } from "@/lib/companies";
import { useTranslation } from "react-i18next";
import { showSuccess, showError } from "@/utils/toast";
import { toast } from "sonner";

export type ExtractedData = {
  company?: string;
  productName?: string;
  productValue?: number;
  orderNumber?: string;
  purchaseDate?: Date;
  description?: string;
  confidence?: number; // Average confidence (0-1)
};

type UseOCRReturn = {
  extractFromImage: (file: File) => Promise<ExtractedData | null>;
  isExtracting: boolean;
  error: string | null;
  resetError: () => void;
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

  // Pre-process image: Grayscale + contrast boost for printed text (using Canvas)
  const preprocessImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i + 1] = data[i + 2] = avg; // Grayscale
          data[i + 3] = 255; // Full opacity
        }
        ctx.putImageData(imageData, 0, 0);

        // Boost contrast (simple threshold for printed text)
        const contrastData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const contrastArr = contrastData.data;
        for (let i = 0; i < contrastArr.length; i += 4) {
          const gray = (contrastArr[i] + contrastArr[i + 1] + contrastArr[i + 2]) / 3;
          const threshold = gray > 128 ? 255 : 0; // Binary-like for sharp text
          contrastArr[i] = contrastArr[i + 1] = contrastArr[i + 2] = threshold;
        }
        ctx.putImageData(contrastData, 0, 0);

        // Resize if too large (optimize for browser)
        if (canvas.width > 800 || canvas.height > 600) {
          const ratio = Math.min(800 / canvas.width, 600 / canvas.height);
          canvas.width *= ratio;
          canvas.height *= ratio;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error("Failed to process image"));
          }
        }, "image/png");
      };

      img.onerror = () => reject(new Error("Invalid image file"));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Parse raw text into structured data (receipt-focused regex for printed text)
  const parseText = useCallback((text: string, lang: string): ExtractedData => {
    const normalizedText = text.toLowerCase().replace(/\s+/g, " ").trim();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    let confidence = 0; // Placeholder; use Tesseract's word confidences if needed

    // Company: Match popular or domain
    let company;
    const domainMatch = normalizedText.match(/@?([a-z0-9-]+\.(com|co\.uk|fr|eu|net|org))/i);
    if (domainMatch) {
      const domain = domainMatch[1];
      company = popularCompanies.find((c) => c.domain.includes(domain))?.name || domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    } else {
      // Fallback to first line or known names
      const firstLine = lines[0];
      company = popularCompanies.find((c) => firstLine.toLowerCase().includes(c.name.toLowerCase()))?.name;
    }

    // Product Name: First descriptive line (non-numeric, >10 chars)
    const productName = lines.find((line) => line.length > 10 && !/^\d+/.test(line) && !["total", "montant", "date", "order"].some((kw) => line.toLowerCase().includes(kw))) || "";

    // Product Value: Currency patterns (EN/FR)
    const currencyMatch = normalizedText.match(/[€$£]?\s*(\d{1,3}(?:[.,]\d{2})?)/) || normalizedText.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(€|eur|usd|£)/i);
    const productValue = currencyMatch ? parseFloat(currencyMatch[1].replace(",", ".")) : undefined;

    // Order Number: Common patterns
    const orderMatch = normalizedText.match(/(?:order|ref|invoice|commande|facture)[#:\s]*([a-z0-9\-]+)/i);
    const orderNumber = orderMatch ? orderMatch[1].toUpperCase() : "";

    // Purchase Date: Common formats (EN/FR), validate with date-fns
    let purchaseDate: Date | undefined;
    const dateMatch = normalizedText.match(/\b(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{2,4})\b/) || normalizedText.match(/\b(\d{4})[\/\-\s](\d{1,2})[\/\-\s](\d{1,2})\b/);
    if (dateMatch) {
      // Assume DD/MM/YYYY for FR, MM/DD/YYYY for EN
      const [, d, m, y] = dateMatch;
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      const candidate = lang === "fr" ? new Date(year, month - 1, day) : new Date(year, day - 1, month);
      if (isValid(candidate) && candidate < new Date() && candidate > new Date("1900-01-01")) {
        purchaseDate = candidate;
      }
    }

    // Description: First few lines after product (short summary)
    const descStart = lines.findIndex((line) => line.toLowerCase().includes("issue") || line.toLowerCase().includes("problem") || line.length > 20);
    const description = descStart > -1 ? lines.slice(descStart, descStart + 2).join(". ").trim() : "";

    const extracted: ExtractedData = {
      company: company || undefined,
      productName: productName || undefined,
      productValue: productValue || undefined,
      orderNumber: orderNumber || undefined,
      purchaseDate: purchaseDate || undefined,
      description: description || undefined,
      confidence: confidence > 0.8 ? confidence : undefined, // Only if high
    };

    // Count filled fields for UX feedback
    const filledCount = Object.values(extracted).filter(Boolean).length;
    if (filledCount > 0) {
      showSuccess(t("ocr.success", { count: filledCount, total: 6 })); // "Auto-filled {{count}} of 6 fields!"
    } else {
      showError(t("ocr.noText")); // "No clear text found—enter manually."
    }

    return extracted;
  }, [i18n.language, t]);

  const extractFromImage = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return null;
    }

    setIsExtracting(true);
    setError(null);
    let worker: any = null;

    try {
      // Pre-process image
      const processedUrl = await preprocessImage(file);

      // Initialize worker (lazy, cached)
      worker = await createWorker(getLanguage(), 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Progress toast or spinner update (optional)
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Run OCR
      const { data: { text, confidence: avgConfidence } } = await worker.recognize(processedUrl);

      if (!text.trim()) {
        throw new Error("No text detected in image.");
      }

      // Parse and return
      const lang = getLanguage();
      const extracted = parseText(text, lang === "eng+fra" ? "fr" : "en");
      extracted.confidence = avgConfidence / 100; // Tesseract gives 0-100

      URL.revokeObjectURL(processedUrl);
      return extracted;

    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR processing failed.";
      setError(msg);
      toast.error(t("ocr.error", { message: msg })); // "Extraction error: {{message}}"
      return null;
    } finally {
      setIsExtracting(false);
      if (worker) {
        await worker.terminate();
      }
    }
  }, [preprocessImage, getLanguage, parseText, t]);

  return { extractFromImage, isExtracting, error, resetError };
}