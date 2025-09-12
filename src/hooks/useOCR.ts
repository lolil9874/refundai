"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";

export function useOCR() {
  const [isExtracting] = useState(false);
  const [fullExtractedText] = useState<string>("OCR functionality is currently disabled.");

  const autoFillFromFile = useCallback(async (file: File) => {
    console.log("File selected, but OCR functionality is disabled:", file.name);
    toast.info("OCR functionality is currently disabled.");
    return null;
  }, []);

  return { autoFillFromFile, isExtracting, fullExtractedText };
}