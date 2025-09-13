import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { preprocessImageFileForOCR } from "@/utils/imagePreprocess";
import { parseOcrText } from "@/api/parseOcr";
import { ParsedFormData } from "@/api/types";

// Use a locally bundled PDF.js worker with Vite
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const OCR_OPTIONS: any = {
  tessedit_pageseg_mode: "6",
  preserve_interword_spaces: "1",
  user_defined_dpi: "300",
};

export function useOCR() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fullExtractedText, setFullExtractedText] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedFormData | null>(null);

  const extractTextFromFile = useCallback(async (file: File) => {
    setIsExtracting(true);
    setFullExtractedText("");
    setParsedData(null);
    const loadingToast = toast.loading("Extracting text from file...");

    try {
      let text = "";

      if (file.type.startsWith("image/")) {
        const processedUrl = await preprocessImageFileForOCR(file);
        const result = await Tesseract.recognize(processedUrl, "eng+fra", OCR_OPTIONS);
        text = result.data.text;
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let combinedText = "";
        const maxPages = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const result = await Tesseract.recognize(imageDataUrl, "eng+fra", OCR_OPTIONS);
          combinedText += result.data.text + "\n\n";
        }
        text = combinedText;
      } else {
        throw new Error("Unsupported file type. Please upload an image or PDF.");
      }

      setFullExtractedText(text.trim() || "No text could be extracted.");
      
      if (text.trim()) {
        toast.loading("Parsing with AI...", { id: loadingToast });
        const parsed = await parseOcrText(text.trim());
        setParsedData(parsed);
        toast.success("Text extracted and parsed successfully!", { id: loadingToast });
      } else {
        toast.success("Text extraction complete!", { id: loadingToast });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("OCR Error:", error);
      setFullExtractedText(`Error during extraction: ${message}`);
      toast.error("Failed to extract text.", { id: loadingToast });
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return { extractTextFromFile, isExtracting, fullExtractedText, parsedData };
}