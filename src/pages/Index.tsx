import { MadeWithDyad } from "@/components/made-with-dyad";
import { RefundForm, RefundFormValues } from "@/components/RefundForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    // In the next step, we can replace this with real calls.
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">REFUNDAI</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Generate refund or complaint emails to companies, hassle-free.
          </p>
        </header>

        <RefundForm onSubmit={handleFormSubmit} isLoading={isLoading} />

        {isLoading && (
          <div className="text-center p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your email and finding contacts...</p>
          </div>
        )}

        {results && <ResultsDisplay results={results} />}

      </main>
      <footer className="w-full max-w-2xl mx-auto mt-8 text-center text-sm text-gray-500">
        <p>Your data is not stored. © REFUNDAI</p>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;