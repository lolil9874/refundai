"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";

// IMPORTANT: Use a locally bundled PDF.js worker with Vite (no CDN).
// Vite's ?worker import returns a Worker constructor we can instantiate.
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

// Wire the worker instance directly (stable for pdfjs-dist v4)
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fullExtractedText, setFullExtractedText] = useState<string>("");

  const extractTextFromFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFullExtractedText("");
    const loadingToast = toast.loading("Extracting text from file...");

    try {
      let text = "";

      if (file.type.startsWith("image/")) {
        // Directly OCR images (PNG, JPG, etc.)
        const result = await Tesseract.recognize(file, "eng");
        text = result.data.text;
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        // Render PDF pages to canvas, convert to JPG, then OCR
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let combinedText = "";

        // Process up to the first 3 pages for performance
        const maxPages = Math.min(numPages, 3);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // upscale for better OCR
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          // Convert canvas to a high-quality JPG to improve OCR stability
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const result = await Tesseract.recognize(imageDataUrl, "eng");
          combinedText += result.data.text;

          if (i < maxPages) {
            combinedText += `\n\n--- End of Page ${i} ---\n\n`;
          }
        }

        text = combinedText;
      } else {
        throw new Error("Unsupported file type. Please upload an image (PNG, JPG) or a PDF.");
      }

      setFullExtractedText(text.trim() || "No text could be extracted from the file.");
      toast.success("Text extraction complete!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred during OCR.";
      console.error("OCR Error:", error);
      setFullExtractedText(`Error during extraction: ${message}`);
      toast.error("Failed to extract text.");
    } finally {
      setIsExtracting(false);
      toast.dismiss(loadingToast);
    }
  }, []);

  return { extractTextFromFile, isExtracting, fullExtractedText };
}