"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { popularCompanies } from "@/lib/companies";
import OffsetButton from "@/components/OffsetButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const formSchema = z
  .object({
    company: z.string().min(1, "Please select a company or 'Other'."),
    otherCompany: z.string().optional(),
    country: z.string().min(1, "Country is required."),
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    productName: z.string().min(1, "Product/Service name is required."),
    productValue: z.preprocess((a) => {
      if (a === "" || a === undefined || a === null) return undefined;
      const n = Number(a);
      return Number.isNaN(n) ? undefined : n;
    }, z.number().nonnegative().optional()),
    orderNumber: z.string().min(1, "Order number is required."),
    purchaseDate: z.date({ required_error: "Purchase date is required." }),
    issueCategory: z.enum(["product", "service"], { required_error: "Please choose a category." }),
    issueType: z.string().min(1, "Issue type is required."),
    description: z.string().min(10, "Please provide a short description (min. 10 characters)."),
    image: z.any().optional(),
    tone: z.number().min(0).max(100),
  })
  .refine(
    (data) => {
      if (data.company === "other") {
        return !!data.otherCompany && data.otherCompany.length > 0;
      }
      return true;
    },
    {
      message: "Please enter the company domain.",
      path: ["otherCompany"],
    },
  );

export type RefundFormValues = z.infer<typeof formSchema>;

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
];

export function RefundForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: RefundFormValues) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

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

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      otherCompany: "",
      country: "",
      firstName: "",
      lastName: "",
      productName: "",
      productValue: undefined,
      orderNumber: "",
      purchaseDate: undefined,
      issueCategory: "product",
      issueType: "",
      description: "",
      tone: 50,
    },
  });

  const watchCompany = form.watch("company");
  const watchCategory = form.watch("issueCategory");
  const watchTone = form.watch("tone");
  const currentReasons = watchCategory === "service" ? serviceReasons : productReasons;

  React.useEffect(() => {
    form.setValue("issueType", "");
  }, [watchCategory]);

  // Test: Remplir et générer automatiquement
  const fillAndGenerate = () => {
    const values: RefundFormValues = {
      company: "Amazon",
      otherCompany: "",
      country: "US",
      firstName: "John",
      lastName: "Doe",
      productName: "Wireless Headphones",
      productValue: 49.99,
      orderNumber: "123-4567890-1234567",
      purchaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      issueCategory: "product",
      issueType: t("refundForm.issue.reasons.product.not_received"),
      description:
        "Package never arrived. Tracking shows no movement since dispatch. Requesting a full refund.",
      image: undefined,
      tone: 60,
    };
    form.reset(values);
    toast.info(t("refundForm.testFillToast"));
    requestAnimationFrame(() => form.handleSubmit(onSubmit)());
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">{t("refundForm.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("refundForm.subtitle")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>{t("refundForm.companySectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("refundForm.companyLabel")}</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {popularCompanies.map((company) => (
                          <Button
                            key={company.name}
                            type="button"
                            variant={field.value === company.name ? "default" : "outline"}
                            className={cn(
                              "flex items-center justify-center gap-2",
                              field.value !== company.name && "bg-white/50 dark:bg-black/20",
                            )}
                            onClick={() => field.onChange(company.name)}
                          >
                            <img
                              src={`https://logo.clearbit.com/${company.domain}`}
                              alt={`${company.name} logo`}
                              className={cn("h-5 w-5", field.value === company.name && "brightness-0 invert")}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            {company.name}
                          </Button>
                        ))}
                        <Button
                          key="other"
                          type="button"
                          variant={field.value === "other" ? "default" : "outline"}
                          className={cn(field.value !== "other" && "bg-white/50 dark:bg-black/20")}
                          onClick={() => field.onChange("other")}
                        >
                          {t("refundForm.otherButton")}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchCompany === "other" && (
                <FormField
                  control={form.control}
                  name="otherCompany"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in duration-300">
                      <FormLabel>{t("refundForm.otherCompanyLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("refundForm.otherCompanyPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => {
                  const selectedCountry = countries.find((c) => c.code === field.value);
                  return (
                    <FormItem>
                      <FormLabel>{t("refundForm.countryLabel")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("refundForm.countryPlaceholder")}>
                              {selectedCountry ? (
                                <div className="flex items-center gap-2">
                                  <span>{selectedCountry.flag}</span>
                                  <span>{selectedCountry.name}</span>
                                  <span className="text-muted-foreground">{selectedCountry.code}</span>
                                </div>
                              ) : (
                                t("refundForm.countryPlaceholder")
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>{t("refundForm.personalInfoSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("refundForm.firstNameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("refundForm.firstNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("refundForm.lastNameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("refundForm.lastNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>{t("refundForm.orderDetailsSectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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

                {/* Catégorie Produit/Service */}
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
                          className="grid grid-cols-2 gap-3"
                        >
                          <div className="flex items-center space-x-2 rounded-md border p-3">
                            <RadioGroupItem id="cat-product" value="product" />
                            <Label htmlFor="cat-product">{t("refundForm.issue.categories.product")}</Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-md border p-3">
                            <RadioGroupItem id="cat-service" value="service" />
                            <Label htmlFor="cat-service">{t("refundForm.issue.categories.service")}</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Motif dynamique */}
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

              {/* Description */}
              <FormField
                control={form.control}
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

              {/* Ton de l'e-mail: une seule barre (0-100%), % au-dessus du curseur, repère à 50% */}
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => {
                  const value = typeof field.value === "number" ? field.value : 50;
                  return (
                    <FormItem>
                      <FormLabel className="block text-center">{t("refundForm.tone.label")}</FormLabel>
                      <FormControl>
                        <div className="relative mt-4 pt-8">
                          {/* Pourcentage au-dessus du curseur */}
                          <div
                            className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2"
                            style={{ left: `${value}%` }}
                          >
                            <span className="px-2 py-1 text-xs font-medium rounded bg-muted text-foreground shadow">
                              {value}%
                            </span>
                          </div>

                          {/* Repère central (50%) */}
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
                        </div>
                      </FormControl>
                      {/* Pas de seconde barre ni de labels sous le slider */}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>{t("refundForm.imageLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                        {...rest}
                      />
                    </FormControl>
                    <FormDescription>{t("refundForm.imageDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <OffsetButton type="submit" className="w-full text-lg" loading={isLoading} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {t("refundForm.submitButtonLoading")}
              </>
            ) : (
              t("refundForm.submitButton")
            )}
          </OffsetButton>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={fillAndGenerate}
            disabled={isLoading}
          >
            {t("refundForm.testFillButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}