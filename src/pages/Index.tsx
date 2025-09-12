import { RefundForm, RefundFormValues } from "@/components/RefundForm";
import { ResultsDisplay, type PremiumContact } from "@/components/ResultsDisplay";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { useState } from "react";
import { ShieldCheck, Banknote } from "lucide-react";
import { popularCompanies } from "@/lib/companies";
import { useTranslation, Trans } from "react-i18next";
import { generateRefund } from "@/api/generateRefund";
import { showError } from "@/utils/toast";

type RefundResult = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
  phones: string[];
  premiumContacts?: PremiumContact[];
  companyDisplayName: string;
  countryCode: string;
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<RefundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizeLocale = (lng: string): "en" | "fr" => {
    const base = (lng || "en").split("-")[0];
    return base === "fr" ? "fr" : "en";
  };

  const toDomain = (raw?: string) => {
    if (!raw) return undefined;
    return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  };

  const resolveCompany = (companyInput: string): { domain: string; display: string } => {
    const selectedPopular = popularCompanies.find((c) => c.name.toLowerCase() === companyInput.toLowerCase());

    if (selectedPopular) {
      return { domain: selectedPopular.domain, display: selectedPopular.name };
    }

    // Treat as a custom domain/name
    const d = toDomain(companyInput) || "example.com";
    const name = d.split(".")[0] || "the company";
    const display = name.charAt(0).toUpperCase() + name.slice(1);
    return { domain: d, display };
  };

  const handleFormSubmit = async (data: RefundFormValues) => {
    setIsLoading(true);
    setResults(null);

    try {
      const { domain, display } = resolveCompany(data.company);

      const payload = {
        companyDomain: domain,
        companyDisplayName: display,
        locale: normalizeLocale(i18n.language),
        country: data.country,
        firstName: data.firstName,
        lastName: data.lastName,
        productName: data.productName,
        productValue: data.productValue,
        currency: data.currency, // New: Include currency
        orderNumber: data.orderNumber,
        purchaseDateISO: data.purchaseDate.toISOString(),
        issueCategory: data.issueCategory,
        issueType: data.issueType,
        description: data.description,
        tone: data.tone,
        hasImage: !!data.image,
      };

      const serverResult = await generateRefund(payload);
      setResults(serverResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      showError(message);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const shineClass =
    "bg-gradient-to-r from-[#145295] via-[#78c4ff] to-[#145295] bg-[200%_auto] bg-clip-text text-transparent animate-shine";

  return (
    <div className="relative px-0 md:px-2">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Trans
            i18nKey="indexPage.title"
            components={[
              <span className={shineClass} key="inc" />,
              <span className={shineClass} key="ref" />,
              <span className={shineClass} key="pct" />,
            ]}
          />
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {t("indexPage.subtitle")}
        </p>
      </section>

      <section className="mx-auto w-full max-w-[2205px] px-2 sm:px-3 md:px-4">
        <div className="mb-4 flex items-center rounded-lg border border-white/20 bg-card/60 p-4 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 dark:bg-card/40">
          <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
          <div className="ml-4">
            <h3 className="font-semibold">{t("indexPage.privacyTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("indexPage.privacyDescription")}</p>
          </div>
        </div>

        <div className="mb-8 flex items-center rounded-lg border border-white/20 bg-card/60 p-4 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 dark:bg-card/40">
          <Banknote className="h-6 w-6 shrink-0 text-primary" />
          <div className="ml-4">
            <h3 className="font-semibold">{t("indexPage.successTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("indexPage.successDescription")}</p>
          </div>
        </div>

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