import { RefundForm, RefundFormValues } from "@/components/RefundForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { format } from "date-fns";

type RefundResult = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
};

const Index = () => {
  const [results, setResults] = useState<RefundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: RefundFormValues) => {
    setIsLoading(true);
    setResults(null);

    // This is a mock of the server functions.
    console.log("Form Data:", data);

    setTimeout(() => {
      const companyName = data.company === 'other' ? data.otherCompany : data.company;
      const mockResults: RefundResult = {
        bestEmail: `support@${(companyName || 'example').toLowerCase().replace(/\s+/g, '')}.com`,
        ranked: [`refunds@${(companyName || 'example').toLowerCase().replace(/\s+/g, '')}.com`],
        forms: [`https://www.${(companyName || 'example').toLowerCase().replace(/\s+/g, '')}.com/contact`],
        links: [],
        subject: `Issue with Order #${data.orderNumber}`,
        body: `Dear ${companyName} Team,\n\nI am writing to you regarding an issue with my recent order.\n\nOrder Details:\n- Product: ${data.productName}\n- Order Number: ${data.orderNumber}\n- Purchase Date: ${format(data.purchaseDate, "PPP")}\n\nThe issue is: ${data.issueType}.\n\n${data.description}\n\nI would appreciate it if you could look into this matter and provide a resolution.\n\nThank you for your time and assistance.\n\nSincerely,\n${data.firstName} ${data.lastName}`,
        hasImage: !!data.image,
      };
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="container relative">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
          Generate refund emails, hassle-free.
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Fill in the details, and we'll find the right contacts and draft a professional email for you in seconds.
        </p>
      </section>

      <section className="mx-auto max-w-3xl w-full">
        <Alert className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Privacy First</AlertTitle>
          <AlertDescription>
            Your data is processed in your browser and is not stored on our servers.
          </AlertDescription>
        </Alert>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <RefundForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </div>

        <div className="mt-8">
          {isLoading && <ResultsSkeleton />}
          {results && <ResultsDisplay results={results} />}
        </div>
      </section>
    </div>
  );
};

export default Index;