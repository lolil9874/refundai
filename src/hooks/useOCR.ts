"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";

// Set up pdf.js worker from jsDelivr CDN (matching library version for compatibility)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;

type ExtractedData = {
  orderNumber?: string;
  productName?: string;
  productValue?: number;
  purchaseDate?: Date;
  // Add more fields as needed in the future
};

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fullExtractedText, setFullExtractedText] = useState<string>("");
  const form = useFormContext();

  const extractTextFromPDFPage = async (pageNum: number, pdf: any): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR if needed
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Run Tesseract on the rendered image
    const { data: { text } } = await Tesseract.recognize(canvas, "eng", {
      workerPath: "https://esm.sh/tesseract.js@5.1.0/dist/worker.min.js",
      corePath: "https://esm.sh/tesseract.js-core@5.1.0/tesseract-core.wasm.js",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
    });

    return text;
  };

  const extractFromImage = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.type.startsWith("image/")) return null;

    setIsExtracting(true);
    setFullExtractedText(""); // Reset display
    try {
      const { data: { text } } = await Tesseract.recognize(file, "eng", {
        workerPath: "https://esm.sh/tesseract.js@5.1.0/dist/worker.min.js",
        corePath: "https://esm.sh/tesseract.js-core@5.1.0/tesseract-core.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });

      setFullExtractedText(text); // Store full text for display

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
      console.error("OCR extraction failed for image:", error);
      setFullExtractedText(`Error during image OCR extraction: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const extractFromPDF = useCallback(async (file: File): Promise<ExtractedData | null> => {
    if (!file.name.toLowerCase().endsWith(".pdf")) return null;

    setIsExtracting(true);
    setFullExtractedText(""); // Reset display
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = "";

      // First, try direct text extraction (for text-based PDFs)
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Limit to first 3 pages for perf
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }

      // If little/no text extracted, fallback to OCR on rendered pages (for scanned PDFs)
      const textLength = fullText.trim().length;
      if (textLength < 50) { // Threshold: if too short, assume scanned
        console.log("Low text content detected—falling back to OCR for PDF pages.");
        setFullExtractedText("Scanned PDF detected—using OCR fallback on page 1...");
        fullText = await extractTextFromPDFPage(1, pdf); // OCR first page
        if (pdf.numPages > 1 && fullText.trim().length < 100) {
          // If still low, try page 2
          fullText += "\n\n--- Page 2 ---\n" + await extractTextFromPDFPage(2, pdf);
        }
      }

      setFullExtractedText(fullText || "No text extracted from PDF."); // Store full text for display

      // Reuse the same regex extraction as for images
      const orderMatch = fullText.match(/(order|inv|receipt|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
      const productMatch = fullText.match(/product|item|description[:\-]?\s*(.+?)(?=\n|$)/i);
      const valueMatch = fullText.match(/total|amount|value[:\-]?\s*\$?(\d+\.?\d*)/i);
      const dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/);

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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setFullExtractedText(`Error during PDF text extraction: ${errorMsg}. Check console for details.`);
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
    } else if (fullExtractedText && fullExtractedText !== "") {
      toast.info("File processed, but auto-fill couldn't extract key details. Check the raw text below for testing.");
    } else {
      toast.info("File uploaded, but no text could be extracted. You can fill manually.");
    }

    return extracted;
  }, [form, extractFromImage, extractFromPDF, fullExtractedText]);

  return { autoFillFromFile, isExtracting, fullExtractedText };
}