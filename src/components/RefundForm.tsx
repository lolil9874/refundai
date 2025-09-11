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
import { Separator } from "./ui/separator";

const formSchema = z.object({
  company: z.string().min(1, "Company is required."),
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
    message: "Please specify the company website/domain.",
    path: ["otherCompany"],
});


export type RefundFormValues = z.infer<typeof formSchema>;

const popularCompanies = ["Amazon", "eBay", "PayPal", "Walmart", "Target"];
const countries = [
  { code: "FR", name: "France" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
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
    <div className="p-6 sm:p-8 border rounded-xl shadow-sm bg-card">
      <h2 className="text-2xl font-bold tracking-tight mb-2">1. Enter Your Details</h2>
      <p className="text-muted-foreground mb-8">Provide as much information as possible for the best results.</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Company & Personal Info</h3>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularCompanies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country/Region</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchCompany === "other" && (
              <FormField
                control={form.control}
                name="otherCompany"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in duration-300">
                    <FormLabel>Company Website/Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium">Order Details</h3>
            <Separator />
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
          </div>
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