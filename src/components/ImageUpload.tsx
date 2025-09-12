"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOCR } from "@/hooks/useOCR";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { autoFillFromFile, isExtracting, fullExtractedText } = useOCR();
  const [isTextBoxOpen, setIsTextBoxOpen] = React.useState(true);

  const hasExtractedText = fullExtractedText && fullExtractedText.trim() !== "" && !fullExtractedText.startsWith("Error");

  return (
    <FormField
      control={form.control}
      name="image"
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FormLabel>{t("refundForm.imageLabel")}</FormLabel>
          <FormControl>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await autoFillFromFile(file);
                  onChange(file);
                }
              }}
              disabled={isLoading || isExtracting}
              {...rest}
            />
          </FormControl>
          <FormDescription>
            {t("refundForm.imageDescription")}
            {isExtracting && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting details from your receipt...
              </div>
            )}
          </FormDescription>
          <FormMessage />

          {/* New Testing Box: Full OCR Text Display */}
          {fullExtractedText && (
            <div className="mt-4">
              <Collapsible open={isTextBoxOpen} onOpenChange={setIsTextBoxOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {t("refundForm.ocrTestBoxTitle", { defaultValue: "Raw OCR Text (for testing)" })}
                    {isTextBoxOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  <Card className="bg-muted/50 border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Extracted Text Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs font-mono overflow-auto max-h-40 p-3 bg-background rounded-md border text-muted-foreground whitespace-pre-wrap">
                        {hasExtractedText 
                          ? fullExtractedText 
                          : fullExtractedText.startsWith("Error") 
                            ? fullExtractedText 
                            : "No text extracted. Try a clearer image/PDF."
                        }
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("refundForm.ocrTestBoxNote", { defaultValue: "(This is for testing OCR output. Auto-fill uses this text to parse details.)" })}
                      </p>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </FormItem>
      )}
    />
  );
}