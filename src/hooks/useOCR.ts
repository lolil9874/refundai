import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { preprocessImageFileForOCR } from "@/utils/imagePreprocess";
import { parseOCRTextWithLLM } from "@/services/openrouter";

// Use a locally bundled PDF.js worker with Vite
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

// Centralized OCR options (typed as any to satisfy varying Tesseract param typings)
const OCR_OPTIONS: any = {
  // Page segmentation mode (equivalent to psm: 6)
  tessedit_pageseg_mode: "6",
  // Keep spaces to help parsing receipts/lines
  preserve_interword_spaces: "1",
  // Hint DPI to improve accuracy
  user_defined_dpi: "300",
};

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fullExtractedText, setFullExtractedText] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);

  const extractTextFromFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFullExtractedText("");
    setParsedData(null);
    const loadingToast = toast.loading("Extracting text from file...");

    try {
      let text = "";

      if (file.type.startsWith("image/")) {
        // Preprocess the image to improve OCR and use eng+fra models
        const processedUrl = await preprocessImageFileForOCR(file);
        const result = await Tesseract.recognize(processedUrl, "eng+fra", OCR_OPTIONS);
        text = result.data.text;
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        // PDF path: render to canvas, convert to JPEG, then OCR
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let combinedText = "";

        const maxPages = Math.min(numPages, 3);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          // Convert to JPEG then OCR (eng+fra can help for bilingual content)
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const result = await Tesseract.recognize(imageDataUrl, "eng+fra", OCR_OPTIONS);
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
      
      // Send to LLM for parsing
      if (text.trim()) {
        toast.update(loadingToast, { description: "Parsing with AI..." });
        const parsed = await parseOCRTextWithLLM(text.trim());
        setParsedData(parsed);
        toast.success("Text extracted and parsed successfully!");
      } else {
        toast.success("Text extraction complete!");
      }
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

  return { extractTextFromFile, isExtracting, fullExtractedText, parsedData };
}