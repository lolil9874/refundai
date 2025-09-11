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
  // Map email to a stable number between 1 and 70 pour pravatar
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  const id = (hash % 70) + 1;
  return `https://i.pravatar.cc/80?img=${id || fallbackIndex}`;
}

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t, i18n } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage, phones, premiumContacts = [] } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t("resultsDisplay.copySuccess", { type }));
  };

  // Top 5 emails: 2 visibles + 3 cachés
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

  // Titres (visibles vs cachés)
  const titlesVisible =
    i18n.language === "fr"
      ? ["Conseiller Client", "Agent Support"]
      : ["Support Advisor", "Support Agent"];
  const titlesHidden =
    i18n.language === "fr"
      ? ["Manager Support Client", "Responsable Customer Care", "Lead Facturation"]
      : ["Customer Support Manager", "Head of Customer Care", "Billing Operations Lead"];

  // Scores: cachés plus élevés
  const scoresVisible = [72, 68];
  const scoresHidden = [95, 92, 89];

  type EmailEntry = {
    email: string;
    visible: boolean;
    title: string;
    score: number;
    avatarUrl?: string;
  };

  const emailEntries: EmailEntry[] = [
    ...visibleEmails.map((e, i) => ({
      email: e,
      visible: true,
      title: titlesVisible[i] || titlesVisible[titlesVisible.length - 1],
      score: scoresVisible[i] || 65,
    })),
    ...hiddenEmails.map((e, i) => ({
      email: e,
      visible: false,
      title: titlesHidden[i] || titlesHidden[titlesHidden.length - 1],
      score: scoresHidden[i] || 88,
      avatarUrl: avatarUrlFromEmail(e, i + 1),
    })),
  ];

  // Sélection d'emails (par défaut tous les visibles)
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

  // Mailto avec les emails sélectionnés
  const recipients = Array.from(selectedEmails);
  const mailtoLink =
    recipients.length > 0
      ? `mailto:${encodeURIComponent(recipients.join(","))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : undefined;

  // Si des emails cachés sont sélectionnés, on affiche le paywall au moment de générer
  const hasHiddenSelected = emailEntries.some(
    (e) => !e.visible && selectedEmails.has(e.email),
  );
  const handleGenerateClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (hasHiddenSelected) {
      e.preventDefault();
      setUnlockOpen(true);
    }
  };

  // Téléphones: 2 visibles + 3 "contacts" (restants + premium)
  const visiblePhones = (phones || []).slice(0, 2);
  const remainingPhonePool = (phones || []).slice(2);
  const premiumPhonePool = (premiumContacts || [])
    .map((c) => c.phoneMasked)
    .filter((v): v is string => !!v);
  const lockedPhones = Array.from(new Set([...remainingPhonePool, ...premiumPhonePool])).slice(0, 3);

  const [unlockOpen, setUnlockOpen] = React.useState(false);

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
                <ul className="divide-y">
                  {emailEntries.map((entry, idx) => {
                    const checked = selectedEmails.has(entry.email);
                    const displayEmail = entry.visible ? entry.email : obfuscateEmailKeepFirst(entry.email);

                    return (
                      <li
                        key={`email-${idx}-${entry.email}`}
                        className={`flex items-center justify-between px-3 py-2 ${entry.visible ? "text-sm" : "text-xs text-muted-foreground"}`}
                        title={displayEmail}
                        aria-label={displayEmail}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleOne(entry.email, v)}
                            className="h-4 w-4"
                            aria-label={`Select ${entry.email}`}
                          />

                          {entry.visible ? (
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <Avatar className="h-6 w-6 shrink-0 ring-1 ring-white/10">
                              <AvatarImage src={entry.avatarUrl} alt={entry.title} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`font-mono truncate ${entry.visible ? "" : "text-foreground/80"}`}>
                                {displayEmail}
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="text-[9px] leading-none text-muted-foreground">
                                  {successLabel}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                                  {entry.score}%
                                </span>
                              </div>
                            </div>
                            <div className={`truncate ${entry.visible ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground"}`}>
                              {entry.title}
                            </div>
                          </div>
                        </div>

                        {entry.visible ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopy(entry.email, "resultsDisplay.copySubject")}
                              aria-label="Copy email"
                              title="Copy email"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">****</span>
                        )}
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
                title={recipients.length === 0 ? "Sélectionnez au moins un email" : undefined}
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