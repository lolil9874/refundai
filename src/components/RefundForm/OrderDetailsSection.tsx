"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { RefundFormValues } from "@/components/RefundForm/types";

interface OrderDetailsSectionProps {
  control: any; // From useForm
  categoryValue: string;
  language: string;
}

export default function OrderDetailsSection({ control, categoryValue, language }: OrderDetailsSectionProps) {
  const { t, i18n } = useTranslation();

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

  const form = useFormContext<RefundFormValues>();
  const watchTone = form.watch("tone");

  const currentReasons = React.useMemo(() => {
    switch (categoryValue) {
      case "service":
        return serviceReasons;
      case "subscription":
        return subscriptionReasons;
      default:
        return productReasons;
    }
  }, [categoryValue, i18n.language]);

  React.useEffect(() => {
    form.setValue("issueType", "");
  }, [categoryValue, form]);

  const value = typeof watchTone === "number" ? watchTone : 50;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("refundForm.productNameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("refundForm.productNamePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="productValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("refundForm.productValueLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t("refundForm.productValuePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("refundForm.orderNumberLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("refundForm.orderNumberPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem className="flex flex-col pt-2">
              <FormLabel>{t("refundForm.purchaseDateLabel")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>{t("refundForm.purchaseDatePlaceholder")}</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category (match height to other inputs) */}
        <FormField
          control={control}
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

        {/* Dynamic reason */}
        <FormField
          control={control}
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

      {/* Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.descriptionLabel")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("refundForm.descriptionPlaceholder")}
                className="resize-none"
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tone */}
      <FormField
        control={control}
        name="tone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("refundForm.tone.label")}</FormLabel>
            <FormControl>
              <div className="relative mt-3 pt-8">
                <div
                  className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${value}%` }}
                >
                  <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-foreground shadow">
                    {value}%
                  </span>
                </div>
                <div
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                  style={{ left: "50%" }}
                >
                  <div className="h-4 w-[2px] bg-muted-foreground/40 rounded" />
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(vals) => field.onChange(vals[0] ?? 0)}
                  aria-label={t("refundForm.tone.label") as string}
                />
                <div className="mt-2 grid grid-cols-3 text-[11px] text-muted-foreground">
                  <span className="justify-self-start">{t("refundForm.tone.empathic")}</span>
                  <span className="justify-self-center">{t("refundForm.tone.formal")}</span>
                  <span className="justify-self-end">{t("refundForm.tone.firm")}</span>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}