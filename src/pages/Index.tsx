import { RefundForm, RefundFormValues } from "@/components/RefundForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { popularCompanies } from "@/lib/companies";
import { useTranslation } from "react-i18next";
import { fr, enUS } from "date-fns/locale";

type RefundResult = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
  phones: string[];
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<RefundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = i18n.language === 'fr' ? fr : enUS;

  const getMockPhones = (country: string) => {
    switch (country) {
      case "US":
      case "CA":
        return ["+1 800 123 4567", "+1 415 555 0101"];
      case "FR":
        return ["+33 1 23 45 67 89", "+33 9 70 00 00 00"];
      case "GB":
        return ["+44 20 1234 5678"];
      case "DE":
        return ["+49 30 123456"];
      case "ES":
        return ["+34 91 123 45 67"];
      case "IT":
        return ["+39 02 1234 5678"];
      default:
        return ["+1 800 000 0000"];
    }
  };

  const handleFormSubmit = async (data: RefundFormValues) => {
    setIsLoading(true);
    setResults(null);

    setTimeout(() => {
      let companyDomain: string | undefined;
      let companyDisplayName: string;

      if (data.company === 'other') {
        companyDomain = data.otherCompany;
        const domainName = companyDomain?.split('.')[0] || 'the company';
        companyDisplayName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      } else {
        const selectedCompany = popularCompanies.find(c => c.name === data.company);
        companyDomain = selectedCompany?.domain;
        companyDisplayName = data.company;
      }

      if (!companyDomain) {
        companyDomain = 'example.com';
        companyDisplayName = 'The Company';
      }

      const issueTypes = t('refundForm.issueTypes', { returnObjects: true }) as Record<string, string>;
      const selectedIssueKey = Object.keys(issueTypes).find(key => issueTypes[key] === data.issueType);
      const translatedIssue = selectedIssueKey ? t(`refundForm.issueTypes.${selectedIssueKey}`) : data.issueType;

      const productValueDisplay =
        data.productValue !== undefined && data.productValue !== null
          ? new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(data.productValue)
          : "";

      const domain = companyDomain.toLowerCase();
      const bestEmail = `support@${domain}`;
      const additionalEmails = [
        `help@${domain}`,
        `refunds@${domain}`,
        `contact@${domain}`,
        `customerservice@${domain}`,
      ];

      const mockResults: RefundResult = {
        bestEmail,
        ranked: additionalEmails,
        forms: [`https://www.${domain}/contact`],
        links: [],
        subject: t('generatedEmail.subject', { orderNumber: data.orderNumber }),
        body: t('generatedEmail.body', {
          companyDisplayName,
          productName: data.productName,
          productValue: productValueDisplay,
          orderNumber: data.orderNumber,
          purchaseDate: format(data.purchaseDate, "PPP", { locale: dateLocale }),
          issueType: translatedIssue,
          description: data.description,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
        hasImage: !!data.image,
        phones: getMockPhones(data.country),
      };
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="container relative">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {t('indexPage.title')}
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {t('indexPage.subtitle')}
        </p>
      </section>

      <section className="mx-auto max-w-3xl w-full">
        <Alert className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 bg-card/60 dark:bg-card/40 backdrop-blur-xl border-white/20 shadow-lg">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>{t('indexPage.privacyTitle')}</AlertTitle>
          <AlertDescription>
            {t('indexPage.privacyDescription')}
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