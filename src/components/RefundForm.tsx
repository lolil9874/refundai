"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

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

const formSchema = z.object({
  company: z.string().min(1, "Please select a company or 'Other'."),
  otherCompany: z.string().optional(),
  country: z.string().min(1, "Country is required."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  productName: z.string().min(1, "Product/Service name is required."),
  orderNumber: z.string().min(1, "Order number is required."),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  issueType: z.string().min(1, "Issue type is required."),
  description: z.string().min(10, "Please provide a short description (min. 10 characters)."),
  image: z.any().optional(),
}).refine(data => {
    if (data.company === 'other') {
        return !!data.otherCompany && data.otherCompany.length > 0;
    }
    return true;
}, {
    message: "Please enter the company domain.",
    path: ["otherCompany"],
});

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

const issueTypes = [
  "Didn't arrive",
  "Quality issue",
  "Wrong item",
  "Refund missing",
  "Other",
];

export function RefundForm({ onSubmit, isLoading }: { onSubmit: (values: RefundFormValues) => void; isLoading: boolean }) {
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      otherCompany: "",
      country: "",
      firstName: "",
      lastName: "",
      productName: "",
      orderNumber: "",
      issueType: "",
      description: "",
    },
  });

  const watchCompany = form.watch("company");

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold tracking-tight">1. Enter Your Details</h2>
        <p className="text-muted-foreground mt-2">Provide as much information as possible for the best results.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Company & Region</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {popularCompanies.map((company) => (
                          <Button
                            key={company.name}
                            type="button"
                            variant={field.value === company.name ? "default" : "outline"}
                            className="flex items-center justify-center gap-2 bg-white/50 dark:bg-black/20"
                            onClick={() => field.onChange(company.name)}
                          >
                            <img 
                              src={`https://logo.clearbit.com/${company.domain}`} 
                              alt={`${company.name} logo`} 
                              className={cn(
                                "h-5 w-5",
                                field.value === company.name && "brightness-0 invert"
                              )}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {company.name}
                          </Button>
                        ))}
                        <Button
                          key="other"
                          type="button"
                          variant={field.value === 'other' ? "default" : "outline"}
                          className="bg-white/50 dark:bg-black/20"
                          onClick={() => field.onChange('other')}
                        >
                          Other
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
                      <FormLabel>Enter domain name</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
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
                  const selectedCountry = countries.find(c => c.code === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Country/Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country">
                              {selectedCountry ? (
                                <div className="flex items-center gap-2">
                                  <span>{selectedCountry.flag}</span>
                                  <span>{selectedCountry.name}</span>
                                  <span className="text-muted-foreground">{selectedCountry.code}</span>
                                </div>
                              ) : "Select a country"}
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
              <CardTitle>Personal Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product/Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Wireless Headphones" {...field} />
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
                      <FormLabel>Order Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 123-4567890-1234567" {...field} />
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
                      <FormLabel>Purchase/Service Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an issue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {issueTypes.map((issue) => (
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
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue with your order..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Image (Optional)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} {...rest} />
                    </FormControl>
                    <FormDescription>
                      A screenshot can help us find more details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full text-lg transition-transform active:scale-[0.98] font-semibold" size="lg" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              "Generate Email & Find Contacts"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}