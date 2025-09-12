"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function IssueSelector() {
  const { t, i18n } = useTranslation();
  const form = useFormContext();
  const watchCategory = useWatch({ control: form.control, name: "issueCategory" });
  const prevCategoryRef = React.useRef(watchCategory);

  // Motifs par catégorie
  const productReasons = [
    t("refundForm.issue.reasons.product.not_received"),
    t("refundForm.issue.reasons.product.late_delivery"),
    t("refundForm.issue.reasons.product.wrong_or_not_as_described"),
    t("refundForm.issue.reasons.product.damaged_or_defective"),
    t("refundForm.issue.reasons.product.other"),
  ];
  const serviceReasons = [
    t("refundForm.issue.reasons.service.not_provided"),
    t("refundForm.issue.reasons.service.delayed_or_rescheduled"),
    t("refundForm.issue.reasons.service.not_as_described_or_poor_quality"),
    t("refundForm.issue.reasons.service.access_issues"),
    t("refundForm.issue.reasons.service.other"),
  ];
  const subscriptionReasons = [
    t("refundForm.issue.reasons.subscription.unwanted_renewal"),
    t("refundForm.issue.reasons.subscription.service_inaccessible"),
    t("refundForm.issue.reasons.subscription.features_missing"),
    t("refundForm.issue.reasons.subscription.incorrect_billing"),
    t("refundForm.issue.reasons.subscription.other"),
  ];

  const currentReasons = React.useMemo(() => {
    switch (watchCategory) {
      case "service":
        return serviceReasons;
      case "subscription":
        return subscriptionReasons;
      default:
        return productReasons;
    }
  }, [watchCategory, i18n.language]);

  React.useEffect(() => {
    // Only reset the issue type if the category has actually changed
    if (prevCategoryRef.current !== watchCategory) {
      form.setValue("issueType", "", { shouldValidate: true });
      prevCategoryRef.current = watchCategory;
    }
  }, [watchCategory, form]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="issueCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.issueCategoryLabel")}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-3 rounded-md border h-10 px-3">
                  <RadioGroupItem id="cat-product" value="product" className="h-4 w-4" />
                  <Label htmlFor="cat-product">{t("refundForm.issue.categories.product")}</Label>
                </div>
                <div className="flex items-center space-x-3 rounded-md border h-10 px-3">
                  <RadioGroupItem id="cat-service" value="service" className="h-4 w-4" />
                  <Label htmlFor="cat-service">{t("refundForm.issue.categories.service")}</Label>
                </div>
                <div className="flex items-center space-x-3 rounded-md border h-10 px-3">
                  <RadioGroupItem id="cat-subscription" value="subscription" className="h-4 w-4" />
                  <Label htmlFor="cat-subscription">{t("refundForm.issue.categories.subscription")}</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="issueType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.issueTypeLabel")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t("refundForm.issueTypePlaceholder")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {currentReasons.map((issue) => (
                  <SelectItem key={issue} value={issue}>
                    {issue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}