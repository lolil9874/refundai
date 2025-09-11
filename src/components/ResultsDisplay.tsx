import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Copy, ExternalLink, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import OffsetButton from "@/components/OffsetButton";
import React from "react";
import UnlockPremiumDialog from "@/components/UnlockPremiumDialog";

type RefundResult = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
  phones: string[];
  premiumContacts?: { phoneMasked?: string | undefined }[];
  companyDisplayName: string;
  countryCode: string;
};

export type PremiumContact = {
  phoneMasked?: string;
};

function obfuscateEmailKeepFirst(email: string) {
  const [local, domain] = email.split("@");
  if (!local) return email;
  const first = local[0] || "*";
  const stars = "***";
  return `${first}${stars}@${domain || ""}`;
}

function avatarUrlFromEmail(email: string, fallbackIndex = 1) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  const id = (hash % 70) + 1;
  return `https://i.pravatar.cc/80?img=${id || fallbackIndex}`;
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function brandFromEmail(email: string) {
  const domain = email.split("@")[1] || "";
  const parts = domain.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const penult = parts[parts.length - 2];
    if (["co", "com", "org", "net", "gov", "edu"].includes(penult) && parts.length >= 3) {
      return capitalize(parts[parts.length - 3]);
    }
  }
  if (parts.length >= 2) {
    return capitalize(parts[parts.length - 2]);
  }
  return "Support";
}

function toEmailToken(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function pickDeterministic<T>(arr: T[], idx: number) {
  if (arr.length === 0) return undefined as unknown as T;
  return arr[idx % arr.length];
}

function domainFromAny(bestEmail?: string, ranked: string[] = [], fallback = "example.com") {
  const pick = bestEmail || ranked[0] || "";
  const parts = pick.split("@");
  if (parts.length === 2) return parts[1];
  return fallback;
}

function shortNameFromFullName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const initial = last ? `${last[0].toUpperCase()}.` : "";
  return `${first} ${initial}`.trim();
}

const SCORE_BADGE_CLASS =
  "inline-flex items-center gap-1 text-[10px] leading-none rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5";

const TAG_CLASS =
  "inline-flex items-center text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 whitespace-nowrap";

type PhoneEntry = {
  number: string;
  visible: boolean;
  type: string;
  score: number;
  fullName?: string;
  avatarUrl?: string;
  originalNumber?: string;
  yearsOfExperience?: number;
  companyDisplayName?: string;
  countryCode?: string;
};

type EmailEntry = {
  email: string;
  visible: boolean;
  title: string;
  score: number;
  avatarUrl?: string;
  brand?: string;
  fullName?: string;
  yearsOfExperience?: number;
  companyDisplayName?: string;
  countryCode?: string;
};

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t, i18n } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage, phones, premiumContacts = [], companyDisplayName, countryCode } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t("resultsDisplay.copySuccess", { type }));
  };

  const topFive = React.useMemo(() => {
    const uniq = new Set<string>();
    if (bestEmail) uniq.add(bestEmail);
    ranked.forEach((e) => {
      if (uniq.size < 5) uniq.add(e);
    });
    return Array.from(uniq).slice(0, 5);
  }, [bestEmail, ranked]);

  const visibleEmails = topFive.slice(0, 2);
  const domain = domainFromAny(bestEmail, ranked);
  const titlesHidden =
    i18n.language === "fr"
      ? ["Manager Support Client", "Responsable Customer Care", "Lead Facturation"]
      : ["Customer Support Manager", "Head of Customer Care", "Billing Operations Lead"];

  const firstNames = ["Florian", "Camille", "Louis", "Chloé", "John", "Sarah", "Michael", "Emily", "Simon", "Grace"];
  const lastNames = ["Martin", "Dubois", "Durand", "Smith", "Johnson", "Brown", "Wilson", "Taylor", "Clark"];

  let seed = 0;
  for (let i = 0; i < domain.length; i++) {
    seed = (seed * 31 + domain.charCodeAt(i)) >>> 0;
  }

  const hiddenInvented = Array.from({ length: 3 }).map((_, i) => {
    const f = pickDeterministic(firstNames, seed + i * 3 + 1);
    const l = pickDeterministic(lastNames, seed + i * 5 + 2);
    const full = `${f} ${l}`;
    const email = `${toEmailToken(f)}.${toEmailToken(l)}@${domain}`;
    return {
      email,
      fullName: shortNameFromFullName(full),
      title: titlesHidden[i] || titlesHidden[titlesHidden.length - 1],
      yearsOfExperience: Math.floor(Math.random() * 8) + 2,
      companyDisplayName,
      countryCode,
    };
  });

  const scoresVisible = [72, 68];
  const scoresHidden = [95, 92, 89];

  const emailEntries: EmailEntry[] = [
    ...visibleEmails.map((e, i) => {
      const brand = brandFromEmail(e);
      const subtitle =
        i18n.language === "fr"
          ? `Agent IA ${brand} — Conseiller client automatique`
          : `AI Agent ${brand} — Automated customer advisor`;
      return {
        email: e,
        visible: true,
        title: subtitle,
        score: scoresVisible[i] || 65,
        brand,
      };
    }),
    ...hiddenInvented.map((p, i) => ({
      email: p.email,
      visible: false,
      title: p.title,
      score: scoresHidden[i] || 88,
      avatarUrl: avatarUrlFromEmail(p.email, i + 1),
      fullName: p.fullName,
      yearsOfExperience: p.yearsOfExperience,
      companyDisplayName: p.companyDisplayName,
      countryCode: p.countryCode,
    })),
  ];

  const [selectedEmails, setSelectedEmails] = React.useState<Set<string>>(new Set(visibleEmails));
  React.useEffect(() => {
    setSelectedEmails(new Set(visibleEmails));
  }, [visibleEmails.join(",")]);

  const allEmailsSelected = selectedEmails.size === emailEntries.length && emailEntries.length > 0;
  const noEmailsSelected = selectedEmails.size === 0;

  const toggleSelectAllEmails = (checked: boolean | "indeterminate") => {
    const allEmails = emailEntries.map((e) => e.email);
    if (checked) {
      setSelectedEmails(new Set(allEmails));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const toggleOneEmail = (email: string, checked: boolean | "indeterminate") => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (checked) next.add(email);
      else next.delete(email);
      return next;
    });
  };

  const recipients = Array.from(selectedEmails);
  const mailtoLink =
    recipients.length > 0
      ? `mailto:${encodeURIComponent(recipients.join(","))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

  const hasHiddenEmailSelected = emailEntries.some((e) => !e.visible && selectedEmails.has(e.email));
  const [unlockOpen, setUnlockOpen] = React.useState(false);
  const handleGenerateClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (hasHiddenEmailSelected) {
      e.preventDefault();
      setUnlockOpen(true);
    }
  };

  const phoneTypesFR = ["Support Général", "Service Client", "Assistance Technique", "Facturation"];
  const phoneTypesEN = ["General Support", "Customer Service", "Technical Assistance", "Billing Department"];

  const mockPhoneEntries: PhoneEntry[] = [];
  const currentVisiblePhones = (phones || []).slice(0, 2);
  const remainingPhonePool = (phones || []).slice(2);
  const premiumPhonePool = (premiumContacts || []).map((c) => c.phoneMasked).filter((v): v is string => !!v);
  const currentLockedPhones = Array.from(new Set([...remainingPhonePool, ...premiumPhonePool])).slice(0, 3);

  currentVisiblePhones.forEach((num, i) => {
    const brand = brandFromEmail(bestEmail || ranked[0] || "example.com");
    const fullName = i18n.language === "fr" ? `Agent IA ${brand}` : `AI Agent ${brand}`;
    mockPhoneEntries.push({
      number: num,
      visible: true,
      type: pickDeterministic(i18n.language === "fr" ? phoneTypesFR : phoneTypesEN, i),
      score: 70 + i * 5,
      fullName: fullName,
      avatarUrl: undefined,
      companyDisplayName: companyDisplayName,
      countryCode: countryCode,
    });
  });

  currentLockedPhones.forEach((num, i) => {
    const f = pickDeterministic(firstNames, seed + i * 7 + 3);
    const l = pickDeterministic(lastNames, seed + i * 11 + 4);
    const full = `${f} ${l}`;
    mockPhoneEntries.push({
      number: num,
      visible: false,
      type: pickDeterministic(i18n.language === "fr" ? phoneTypesFR : phoneTypesEN, i + currentVisiblePhones.length),
      score: 85 + i * 3,
      fullName: shortNameFromFullName(full),
      avatarUrl: avatarUrlFromEmail(full, i + 10),
      originalNumber: "UNLOCKED_NUMBER_PLACEHOLDER",
      yearsOfExperience: Math.floor(Math.random() * 10) + 3,
      companyDisplayName: companyDisplayName,
      countryCode: countryCode,
    });
  });

  const [selectedPhones, setSelectedPhones] = React.useState<Set<string>>(new Set(currentVisiblePhones));
  const allPhonesSelected = selectedPhones.size === currentVisiblePhones.length && currentVisiblePhones.length > 0;
  const noPhonesSelected = selectedPhones.size === 0;

  const toggleSelectAllPhones = (checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedPhones(new Set(currentVisiblePhones));
    } else {
      setSelectedPhones(new Set());
    }
  };

  const toggleOnePhone = (number: string, checked: boolean | "indeterminate") => {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      if (checked) next.add(number);
      else next.delete(number);
      return next;
    });
  };

  const successLabel = i18n.language === "fr" ? "% de succès" : "Success rate";

  return (
    <>
      <Card className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("resultsDisplay.title")}</CardTitle>
          <CardDescription>{t("resultsDisplay.description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ... emails + generated email sections unchanged above ... */}

          <section className="pt-2">
            <h3 className="font-semibold mb-4 text-lg">{t("resultsDisplay.generatedEmailLabel")}</h3>
            {/* subject/body blocks unchanged */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <OffsetButton
                href={mailtoLink}
                onClick={handleGenerateClick}
                className="w-full"
                aria-disabled={recipients.length === 0}
                disabled={recipients.length === 0}
                title={recipients.length === 0 ? "Select at least one email" : undefined}
                shineText
              >
                {t("resultsDisplay.openInEmailAppButton")}
              </OffsetButton>
            </div>
          </section>

          {/* phones + other sections unchanged below */}
        </CardContent>
      </Card>

      <UnlockPremiumDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};