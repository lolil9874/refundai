import { RefundForm, RefundFormValues } from "@/components/RefundForm";
import { ResultsDisplay, type PremiumContact } from "@/components/ResultsDisplay";
import { ResultsSkeleton } from "@/components/ResultsSkeleton";
import { useState } from "react";
import { ShieldCheck, Banknote } from "lucide-react";
import { format } from "date-fns";
import { popularCompanies } from "@/lib/companies";
import { useTranslation, Trans } from "react-i18next";
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
  premiumContacts?: PremiumContact[];
  companyDisplayName: string;
  countryCode: string;
};

const Index = () => {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<RefundResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = i18n.language === "fr" ? fr : enUS;

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

  const maskLocalPart = (local: string) => {
    if (local.length <= 2) return `${local[0] || "*"}***`;
    const showFirst = 1;
    const showLast = Math.min(2, local.length - 1);
    const start = local.slice(0, showFirst);
    const end = local.slice(-showLast);
    return `${start}${"*".repeat(Math.max(3, local.length - showFirst - showLast))}${end}`;
  };

  const makePremiumContacts = (companyDisplayName: string, domain: string, country: string): PremiumContact[] => {
    const base = [
      { name: i18n.language === "fr" ? "Fiona Trotter" : "Fiona Trotter", title: i18n.language === "fr" ? "Manager Support Client" : "Customer Support Manager", local: "ftr", img: "12", dept: "SAV", score: 86 },
      { name: i18n.language === "fr" ? "Marc Dubois" : "Marc Dubois", title: i18n.language === "fr" ? "Lead Service Client" : "Customer Care Lead", local: "mdubois", img: "28", dept: "Customer Care", score: 82 },
      { name: i18n.language === "fr" ? "Sara Kim" : "Sara Kim", title: i18n.language === "fr" ? "Responsable Facturation" : "Billing Operations", local: "skim", img: "47", dept: "Billing", score: 78 },
    ];
    const countryTag = country || "INTL";
    return base.map((p) => ({
      name: p.name,
      title: p.title,
      department: p.dept,
      company: companyDisplayName,
      emailMasked: `${maskLocalPart(p.local)}@${domain}`,
      phoneMasked:
        country === "FR"
          ? "+33 •• •• •• •• 89"
          : country === "US" || country === "CA"
          ? "+1 ••• ••• ••01"
          : "+44 •• •• •• •• 78",
      avatarUrl: `https://i.pravatar.cc/150?img=${p.img}`,
      location: countryTag,
      score: p.score,
      tags: [p.dept, countryTag],
    }));
  };

  const handleFormSubmit = async (data: RefundFormValues) => {
    setIsLoading(true);
    setResults(null);

    setTimeout(() => {
      let companyDomain: string | undefined;
      let companyDisplayName: string;

      if (data.company === "other") {
        companyDomain = data.otherCompany;
        const domainName = companyDomain?.split(".")[0] || "the company";
        companyDisplayName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
      } else {
        const selectedCompany = popularCompanies.find((c) => c.name === data.company);
        companyDomain = selectedCompany?.domain;
        companyDisplayName = data.company;
      }

      if (!companyDomain) {
        companyDomain = "example.com";
        companyDisplayName = "The Company";
      }

      const translatedIssue = data.issueType;

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

      const mockPremium = makePremiumContacts(companyDisplayName, domain, data.country);

      const mockResults: RefundResult = {
        bestEmail,
        ranked: additionalEmails,
        forms: [`https://www.${domain}/contact`],
        links: [],
        subject: t("generatedEmail.subject", { orderNumber: data.orderNumber }),
        body: t("generatedEmail.body", {
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
        premiumContacts: mockPremium,
        companyDisplayName: companyDisplayName,
        countryCode: data.country,
      };
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };

  const shineClass =
    "bg-gradient-to-r from-primary via-logo-light-blue to-primary bg-[200%_auto] bg-clip-text text-transparent animate-shine";

  return (
    <div className="container relative">
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

      <section className="mx-auto max-w-3xl w-full">
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