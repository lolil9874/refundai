"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";

// Set up pdf.js worker from jsDelivr CDN (reliable fallback)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.js`;

type ExtractedData = {
  orderNumber?: string;
  productName?: string;
  productValue?: number;
  purchaseDate?: Date;
  // Add more fields as needed in the future
};

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const form = useFormContext();

  const extractFromImage = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.type.startsWith("image/")) return null;

    setIsExtracting(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, "eng", {
        workerPath: "https://esm.sh/tesseract.js@5.1.0/dist/worker.min.js",
        corePath: "https://esm.sh/tesseract.js-core@5.1.0/tesseract-core.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });

      // Simple regex-based extraction (improve with ML if needed)
      const orderMatch = text.match(/(order|inv|receipt|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
      const productMatch = text.match(/product|item|description[:\-]?\s*(.+?)(?=\n|$)/i);
      const valueMatch = text.match(/total|amount|value[:\-]?\s*\$?(\d+\.?\d*)/i);
      const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);

      const extracted: ExtractedData = {};

      if (orderMatch) extracted.orderNumber = orderMatch[2].trim();
      if (productMatch) extracted.productName = productMatch[1].trim();
      if (valueMatch) extracted.productValue = parseFloat(valueMatch[1]);
      if (dateMatch) {
        // Parse date (simple; use date-fns for robustness)
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) extracted.purchaseDate = parsed;
      }

      return Object.keys(extracted).length > 0 ? extracted : null;
    } catch (error) {
      console.error("OCR extraction failed:", error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const extractFromPDF = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.name.toLowerCase().endsWith(".pdf")) return null;

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }

      // Reuse the same regex extraction as for images
      const orderMatch = fullText.match(/(order|inv|receipt|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
      const productMatch = fullText.match(/product|item|description[:\-]?\s*(.+?)(?=\n|$)/i);
      const valueMatch = fullText.match(/total|amount|value[:\-]?\s*\$?(\d+\.?\d*)/i);
      const dateMatch = fullText.match(/(\d{1,2}\/\d{2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);

      const extracted: ExtractedData = {};

      if (orderMatch) extracted.orderNumber = orderMatch[2].trim();
      if (productMatch) extracted.productName = productMatch[1].trim();
      if (valueMatch) extracted.productValue = parseFloat(valueMatch[1]);
      if (dateMatch) {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) extracted.purchaseDate = parsed;
      }

      return Object.keys(extracted).length > 0 ? extracted : null;
    } catch (error) {
      console.error("PDF extraction failed:", error);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const autoFillFromFile = useCallback(async (file: File) => {
    let extracted = null;

    if (file.type.startsWith("image/")) {
      extracted = await extractFromImage(file);
    } else if (file.name.toLowerCase().endsWith(".pdf")) {
      extracted = await extractFromPDF(file);
    }

    if (extracted) {
      // Auto-fill form fields
      if (extracted.orderNumber) form.setValue("orderNumber", extracted.orderNumber);
      if (extracted.productName) form.setValue("productName", extracted.productName);
      if (extracted.productValue) form.setValue("productValue", extracted.productValue);
      if (extracted.purchaseDate) form.setValue("purchaseDate", extracted.purchaseDate);

      toast.success("Auto-filled details from your receipt! Review and edit as needed. ✨");
    } else {
      toast.info("File uploaded, but auto-fill couldn't extract details. You can fill manually.");
    }

    return extracted;
  }, [form, extractFromImage, extractFromPDF]);

  return { autoFillFromFile, isExtracting };
}