"use client";

import { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { parseISO, isValid } from "date-fns";
import { popularCompanies } from "@/lib/companies";
import type { RefundFormValues } from "@/components/RefundForm";

export type ExtractedData = Partial<Pick<RefundFormValues, "company" | "otherCompany" | "productName" | "productValue" | "orderNumber" | "purchaseDate">>;

export const useOCR = (language: "en" | "fr") => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-process image for better OCR: grayscale + contrast boost
  const preprocessImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      img.onload = () => {
        // Resize to optimal size (reduce large images for speed, preserve quality)
        const maxDim = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;

        // Draw grayscale
        ctx.filter = "grayscale(100%)";
        ctx.drawImage(img, 0, 0, width, height);

        // Boost contrast (simple via filter or manual pixel tweak)
        ctx.filter = "contrast(150%) brightness(110%)";
        ctx.drawImage(canvas, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to process image"));
        }, "image/png");
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Parse raw OCR text for receipt fields
  const parseText = useCallback((text: string, lang: "en" | "fr"): ExtractedData => {
    const lines = text.toLowerCase().split("\n").filter((line) => line.trim());
    const extracted: ExtractedData = {};

    // Company: Match popular or extract domain-like words (top lines often have company)
    const companyLine = lines.find((line) =>
      popularCompanies.some((c) => line.includes(c.name.toLowerCase()) || line.includes(c.domain.split(".")[0]))
    );
    if (companyLine) {
      const matched = popularCompanies.find((c) => companyLine.includes(c.name.toLowerCase()));
      if (matched) {
        extracted.company = matched.name;
      } else {
        // Fallback: Extract domain-like (e.g., "amazon.com")
        const domainMatch = companyLine.match(/([a-z0-9-]+\.(com|fr|co|uk|eu))/i);
        if (domainMatch) {
          extracted.otherCompany = domainMatch[1];
          extracted.company = "other";
        }
      }
    }

    // Product Name: First substantial non-numeric line (often after "Item" or similar)
    const productLine = lines.find((line) => line.length > 10 && !line.match(/^\d/));
    if (productLine) {
      extracted.productName = productLine.trim().replace(/[#:\-]/g, "").substring(0, 100); // Clean and limit
    }

    // Product Value: Currency patterns ($, €, £) + number
    const valueMatch = text.match(/[€$£]\s*(\d+(?:,\d{2})?|\d+\.\d{2})/i);
    if (valueMatch) {
      // Handle locale (comma vs dot for decimals)
      const rawValue = valueMatch[1].replace(",", ".");
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue) && numValue > 0) {
        extracted.productValue = numValue;
      }
    }

    // Order Number: Patterns like "order #123", "ref: abc-456"
    const orderMatch = text.match(/(order|ref|invoice|cmd)\s*[#:]?\s*([a-z0-9\-]+)/i);
    if (orderMatch) {
      extracted.orderNumber = orderMatch[2].toUpperCase();
    }

    // Purchase Date: Common formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
    const dateMatch = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      // Try parsing with date-fns (handles various formats)
      const parsed = parseISO(dateStr.replace(/[/\.]/g, "-")); // Normalize to ISO-ish
      if (isValid(parsed)) {
        extracted.purchaseDate = parsed;
      }
    }

    // Filter low-confidence or empty fields
    Object.keys(extracted).forEach((key) => {
      if (!extracted[key as keyof ExtractedData]) {
        delete extracted[key as keyof ExtractedData];
      }
    });

    return extracted;
  }, []);

  const extractFromImage = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    setIsExtracting(true);
    setError(null);

    try {
      // Pre-process image
      const processedBlob = await preprocessImage(file);

      // Initialize Tesseract worker with language
      const worker = await createWorker(language === "fr" ? "fra" : "eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Recognize text
      const { data: { text } } = await worker.recognize(processedBlob);
      await worker.terminate();

      if (!text || text.trim().length < 10) {
        throw new Error("No text detected in image");
      }

      // Parse and return extracted data
      const extracted = parseText(text, language);
      if (Object.keys(extracted).length === 0) {
        throw new Error("No usable data extracted—try a clearer image");
      }

      return extracted;
    } catch (err) {
      const message = err instanceof Error ? err.message : "OCR extraction failed";
      setError(message);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, [language, preprocessImage, parseText]);

  return { extractFromImage, isExtracting, error };
};