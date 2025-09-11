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
};

export type PremiumContact = {
  phoneMasked?: string;
};

function obfuscateEmailKeepFirst(email: string) {
  const [local, domain] = email.split("@");
  if (!local) return email;
  const first = local[0] || "*";
  const stars = "*".repeat(Math.max(3, (local.length || 1) - 1));
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

function fullNameFromEmail(email: string) {
  const localRaw = email.split("@")[0] || "";
  const local = localRaw.split("+")[0]; // remove any +tag
  const parts = local.replace(/\d+/g, "").split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = capitalize(parts[0]);
    const last = capitalize(parts[parts.length - 1]);
    return `${first} ${last}`;
  }
  if (parts.length === 1) {
    return capitalize(parts[0]);
  }
  return "";
}

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t, i18n } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage, phones, premiumContacts = [] } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t("resultsDisplay.copySuccess", { type }));
  };

  // Top 5 emails: 2 visibles + 3 cachés (payants)
  const topFive = React.useMemo(() => {
    const uniq = new Set<string>();
    if (bestEmail) uniq.add(bestEmail);
    ranked.forEach((e) => {
      if (uniq.size < 5) uniq.add(e);
    });
    return Array.from(uniq).slice(0, 5);
  }, [bestEmail, ranked]);

  const visibleEmails = topFive.slice(0, 2);
  const hiddenEmails = topFive.slice(2, 5);

  const titlesHidden =
    i18n.language === "fr"
      ? ["Manager Support Client", "Responsable Customer Care", "Lead Facturation"]
      : ["Customer Support Manager", "Head of Customer Care", "Billing Operations Lead"];

  const scoresVisible = [72, 68];
  const scoresHidden = [95, 92, 89];

  type EmailEntry = {
    email: string;
    visible: boolean;
    title: string;
    score: number;
    avatarUrl?: string;
    brand?: string;
  };

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
    ...hiddenEmails.map((e, i) => ({
      email: e,
      visible: false,
      title: titlesHidden[i] || titlesHidden[titlesHidden.length - 1],
      score: scoresHidden[i] || 88,
      avatarUrl: avatarUrlFromEmail(e, i + 1),
    })),
  ];

  // Sélection (par défaut: visibles)
  const [selectedEmails, setSelectedEmails] = React.useState<Set<string>>(new Set(visibleEmails));
  React.useEffect(() => {
    setSelectedEmails(new Set(visibleEmails));
  }, [visibleEmails.join(",")]);

  const allSelected = selectedEmails.size === emailEntries.length && emailEntries.length > 0;
  const noneSelected = selectedEmails.size === 0;

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    const allEmails = emailEntries.map((e) => e.email);
    if (checked) {
      setSelectedEmails(new Set(allEmails));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const toggleOne = (email: string, checked: boolean | "indeterminate") => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (checked) next.add(email);
      else next.delete(email);
      return next;
    });
  };

  // Mailto
  const recipients = Array.from(selectedEmails);
  const mailtoLink =
    recipients.length > 0
      ? `mailto:${encodeURIComponent(recipients.join(","))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

  // Paywall si des cachés sont sélectionnés pour générer
  const hasHiddenSelected = emailEntries.some((e) => !e.visible && selectedEmails.has(e.email));
  const [unlockOpen, setUnlockOpen] = React.useState(false);
  const handleGenerateClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (hasHiddenSelected) {
      e.preventDefault();
      setUnlockOpen(true);
    }
  };

  // Téléphones
  const visiblePhones = (phones || []).slice(0, 2);
  const remainingPhonePool = (phones || []).slice(2);
  const premiumPhonePool = (premiumContacts || [])
    .map((c) => c.phoneMasked)
    .filter((v): v is string => !!v);
  const lockedPhones = Array.from(new Set([...remainingPhonePool, ...premiumPhonePool])).slice(0, 3);

  const successLabel = i18n.language === "fr" ? "% de succès" : "Success rate";

  return (
    <>
      <Card className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t("resultsDisplay.title")}
          </CardTitle>
          <CardDescription>{t("resultsDisplay.description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {emailEntries.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t("resultsDisplay.emailsToContactLabel")}</h3>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={allSelected ? true : noneSelected ? false : "indeterminate"}
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                    aria-label={t("resultsDisplay.selectAll") as string}
                  />
                  <span>{t("resultsDisplay.selectAll")}</span>
                </label>
              </div>

              <div className="rounded-md border bg-card/50">
                {/* En-tête de colonne pour le score */}
                <div className="px-3 py-1">
                  <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2">
                    <span />
                    <span />
                    <span />
                    <span className="inline-flex items-center text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                      {successLabel}
                    </span>
                    <span />
                  </div>
                </div>

                <ul className="divide-y">
                  {emailEntries.map((entry, idx) => {
                    const checked = selectedEmails.has(entry.email);
                    const displayEmail = entry.visible ? entry.email : obfuscateEmailKeepFirst(entry.email);
                    const isPaid = !entry.visible;
                    const rowTint = isPaid ? "bg-blue-50/40 dark:bg-blue-950/20" : "";
                    const emailTint = isPaid ? "text-blue-700 dark:text-blue-300 font-medium" : "";

                    return (
                      <li
                        key={`email-${idx}-${entry.email}`}
                        className={`grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2 px-3 py-2 ${entry.visible ? "text-sm" : "text-xs"} ${rowTint}`}
                        title={displayEmail}
                        aria-label={displayEmail}
                      >
                        {/* Col 1: checkbox */}
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleOne(entry.email, v)}
                          className="h-4 w-4"
                          aria-label={`Select ${entry.email}`}
                        />

                        {/* Col 2: avatar/icon */}
                        {entry.visible ? (
                          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-white/10">
                            <AvatarImage src={entry.avatarUrl} alt={entry.title} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}

                        {/* Col 3: contenu principal */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-mono truncate ${emailTint}`}>
                              {displayEmail}
                            </span>
                            {/* Titre de poste à côté pour payants */}
                            {isPaid && (
                              <span className="inline-flex items-center text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                                {entry.title}
                              </span>
                            )}
                          </div>
                          {/* Sous-ligne:
                              - payants: Prénom Nom complet
                              - gratuits: libellé Agent IA {marque} */}
                          <div className={`truncate ${entry.visible ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground"}`}>
                            {entry.visible ? entry.title : fullNameFromEmail(entry.email)}
                          </div>
                        </div>

                        {/* Col 4: score */}
                        <span className="justify-self-start inline-flex items-center gap-1 text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                          {entry.score}%
                        </span>

                        {/* Col 5: actions - bouton copier partout; payants -> paywall */}
                        <div className="flex items-center gap-1 justify-self-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              if (entry.visible) {
                                handleCopy(entry.email, "resultsDisplay.copySubject");
                              } else {
                                setUnlockOpen(true);
                              }
                            }}
                            aria-label={entry.visible ? "Copy email" : "Unlock to copy"}
                            title={entry.visible ? "Copy email" : "Unlock to copy"}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          <section className="pt-2">
            <h3 className="font-semibold mb-4 text-lg">
              {t("resultsDisplay.generatedEmailLabel")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("resultsDisplay.subjectLabel")}
                </label>
                <div className="relative mt-1">
                  <p className="p-3 pr-10 bg-muted/50 rounded-md font-medium text-sm">
                    {subject}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(subject, "resultsDisplay.copySubject")}
                    aria-label={t("resultsDisplay.copySubject") as string}
                    title={t("resultsDisplay.copySubject") as string}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("resultsDisplay.bodyLabel")}
                </label>
                <div className="relative mt-1">
                  <div className="p-3 pr-10 h-56 overflow-y-auto bg-muted/50 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                    {body}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(body, "resultsDisplay.copyBody")}
                    aria-label={t("resultsDisplay.copyBody") as string}
                    title={t("resultsDisplay.copyBody") as string}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <OffsetButton
                href={mailtoLink}
                onClick={handleGenerateClick}
                className="w-full"
                aria-disabled={recipients.length === 0}
                disabled={recipients.length === 0}
                title={recipients.length === 0 ? "Select at least one email" : undefined}
              >
                {t("resultsDisplay.openInEmailAppButton")}
              </OffsetButton>
            </div>
          </section>

          {(visiblePhones.length > 0 || lockedPhones.length > 0) && (
            <section className="pt-2">
              <h3 className="font-semibold mb-3 text-lg">
                {t("resultsDisplay.phoneNumbersLabel")}
              </h3>
              <div className="rounded-md border bg-card/50">
                <ul className="divide-y">
                  {visiblePhones.map((num, i) => (
                    <li key={`p-vis-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${num.replace(/\s+/g, "")}`} className="hover:underline truncate">
                          {num}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(num, "resultsDisplay.copyPhone")}
                        aria-label={t("resultsDisplay.copyPhone") as string}
                        title={t("resultsDisplay.copyPhone") as string}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {lockedPhones.map((num, i) => (
                    <li
                      key={`p-lock-${i}`}
                      className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 cursor-pointer"
                      onClick={() => setUnlockOpen(true)}
                      title={num}
                      aria-label={num}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{num}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">****</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {(forms.length > 0 || links.length > 0) && (
            <section className="pt-2">
              <h3 className="font-semibold mb-2 text-lg">
                {t("resultsDisplay.otherOptionsLabel")}
              </h3>
              <ul className="space-y-2 text-sm">
                {forms.map((form, i) => (
                  <li key={`f-${i}`} className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a
                      href={form}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {t("resultsDisplay.contactForm")}
                    </a>
                  </li>
                ))}
                {links.map((link, i) => (
                  <li key={`l-${i}`} className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {t("resultsDisplay.supportPage")}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasImage && (
            <p
              className="text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md"
              dangerouslySetInnerHTML={{ __html: t("resultsDisplay.imageReminder") }}
            />
          )}
        </CardContent>
      </Card>

      <UnlockPremiumDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};