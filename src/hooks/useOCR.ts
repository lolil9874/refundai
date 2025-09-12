"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";

// Configure pdf.js worker from a stable CDN to avoid 404 errors
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.js`;

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fullExtractedText, setFullExtractedText] = useState<string>("");

  const extractTextFromFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFullExtractedText(""); // Clear previous results
    const loadingToast = toast.loading("Extracting text from file...");

    try {
      let text = "";
      if (file.type.startsWith("image/")) {
        // Process image (PNG, JPG, etc.)
        const result = await Tesseract.recognize(file, "eng");
        text = result.data.text;
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        // Process PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        let combinedText = "";

        // Process up to the first 3 pages for performance
        for (let i = 1; i <= Math.min(numPages, 3); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          
          const result = await Tesseract.recognize(canvas, "eng");
          combinedText += result.data.text;
          if (i < Math.min(numPages, 3)) {
             combinedText += "\n\n--- End of Page " + i + " ---\n\n";
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