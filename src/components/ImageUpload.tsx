"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useOCR } from "@/hooks/useOCR";
import { Loader2, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ImageUpload({ isLoading }: { isLoading: boolean }) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { extractTextFromFile, isExtracting, fullExtractedText, parsedData } = useOCR();
  const [isTextBoxOpen, setIsTextBoxOpen] = React.useState(false);

  // Auto-fill form when parsed data is available
  React.useEffect(() => {
    if (parsedData) {
      const { setValue } = form;
      
      // Auto-fill company
      if (parsedData.company) {
        setValue("company", parsedData.company);
      } else if (parsedData.otherCompany) {
        setValue("company", "other");
        setValue("otherCompany", parsedData.otherCompany);
      }
      
      // Auto-fill product info
      if (parsedData.productName) {
        setValue("productName", parsedData.productName);
      }
      
      if (parsedData.productValue) {
        setValue("productValue", parsedData.productValue);
      }
      
      if (parsedData.currency) {
        setValue("currency", parsedData.currency);
      }
      
      if (parsedData.orderNumber) {
        setValue("orderNumber", parsedData.orderNumber);
      }
      
      if (parsedData.purchaseDate) {
        const date = new Date(parsedData.purchaseDate);
        if (!isNaN(date.getTime())) {
          setValue("purchaseDate", date);
        }
      }
      
      // Auto-fill personal info if available
      if (parsedData.firstName) {
        setValue("firstName", parsedData.firstName);
      }
      
      if (parsedData.lastName) {
        setValue("lastName", parsedData.lastName);
      }
      
      // Auto-fill issue info
      if (parsedData.issueType) {
        setValue("issueType", parsedData.issueType);
      }
      
      if (parsedData.description) {
        setValue("description", parsedData.description);
      }
    }
  }, [parsedData, form]);

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
                  await extractTextFromFile(file);
                  onChange(file);
                  setIsTextBoxOpen(true);
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
                Extracting and parsing text... This may take a moment.
              </div>
            )}
          </FormDescription>
          <FormMessage />

          {/* Show parsed data if available */}
          {parsedData && (
            <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Extracted Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {parsedData.productName && (
                    <div>
                      <span className="font-medium">Product:</span> {parsedData.productName}
                    </div>
                  )}
                  {parsedData.productValue && (
                    <div>
                      <span className="font-medium">Value:</span> {parsedData.currency || '$'}{parsedData.productValue}
                    </div>
                  )}
                  {parsedData.orderNumber && (
                    <div>
                      <span className="font-medium">Order:</span> {parsedData.orderNumber}
                    </div>
                  )}
                  {parsedData.purchaseDate && (
                    <div>
                      <span className="font-medium">Date:</span> {parsedData.purchaseDate}
                    </div>
                  )}
                  {parsedData.company && (
                    <div>
                      <span className="font-medium">Company:</span> {parsedData.company}
                    </div>
                  )}
                  {parsedData.otherCompany && (
                    <div>
                      <span className="font-medium">Company:</span> {parsedData.otherCompany}
                    </div>
                  )}
                  {parsedData.firstName && (
                    <div>
                      <span className="font-medium">Name:</span> {parsedData.firstName} {parsedData.lastName}
                    </div>
                  )}
                  {parsedData.issueType && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Issue:</span> {parsedData.issueType}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Form fields have been auto-filled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {fullExtractedText && (
            <div className="mt-4">
              <Collapsible open={isTextBoxOpen} onOpenChange={setIsTextBoxOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {t("refundForm.ocrTestBoxTitle", { defaultValue: "Raw OCR Text (for testing)" })}
                    {isTextBoxOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Card className="bg-muted/50 border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Extracted Text Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs font-mono overflow-auto max-h-60 p-3 bg-background rounded-md border text-muted-foreground whitespace-pre-wrap">
                        {fullExtractedText}
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