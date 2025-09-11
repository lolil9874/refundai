import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const firstEmail = topFive[0];
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

  // Visible (free) emails around 65%
  const scoresVisible = [66, 64];
  // Premium (locked) higher
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

  const [selectedEmails, setSelectedEmails] = React.useState<Set<string>>(
    new Set(firstEmail ? [firstEmail] : []),
  );

  React.useEffect(() => {
    setSelectedEmails(new Set(firstEmail ? [firstEmail] : []));
  }, [firstEmail]);

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

  const handleOpenEmailApp = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (hasHiddenEmailSelected) {
      e.preventDefault();
      setUnlockOpen(true);
      return;
    }
    if (mailtoLink) {
      window.location.href = mailtoLink;
    }
  };

  const phoneTypesFR = ["Support Général", "Service Client", "Assistance Technique", "Facturation"];
  const phoneTypesEN = ["General Support", "Customer Service", "Technical Assistance", "Billing Department"];

  const mockPhoneEntries: PhoneEntry[] = [];
  const currentVisiblePhones = (phones || []).slice(0, 2);
  const remainingPhonePool = (phones || []).slice(2);
  const premiumPhonePool = (premiumContacts || []).map((c) => c.phoneMasked).filter((v): v is string => !!v);
  const currentLockedPhones = Array.from(new Set([...remainingPhonePool, ...premiumPhonePool])).slice(0, 3);

  // Visible (free) phones around 65%
  currentVisiblePhones.forEach((num, i) => {
    const brand = brandFromEmail(bestEmail || ranked[0] || "example.com");
    const fullName = i18n.language === "fr" ? `Agent IA ${brand}` : `AI Agent ${brand}`;
    mockPhoneEntries.push({
      number: num,
      visible: true,
      type: pickDeterministic(i18n.language === "fr" ? phoneTypesFR : phoneTypesEN, i),
      score: 65 + (i === 0 ? 1 : -1), // ~65%
      fullName: fullName,
      avatarUrl: undefined,
      companyDisplayName: companyDisplayName,
      countryCode: countryCode,
    });
  });

  // Premium (locked) higher
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

  const successLabel = i18n.language === "fr" ? "% de succès" : "Success rate";

  return (
    <>
      <Card className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("resultsDisplay.title")}</CardTitle>
          <CardDescription>{t("resultsDisplay.description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {emailEntries.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t("resultsDisplay.emailsToContactLabel")}</h3>
                <label className="group flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={allEmailsSelected ? true : noEmailsSelected ? false : "indeterminate"}
                    onCheckedChange={toggleSelectAllEmails}
                    className="h-4 w-4"
                    aria-label={t("resultsDisplay.selectAll") as string}
                  />
                  <span className="bg-gradient-to-r from-primary via-sky-400 to-primary bg-clip-text text-transparent bg-[200%_auto] group-hover:animate-shine">
                    {t("resultsDisplay.selectAll")}
                  </span>
                </label>
              </div>

              <div className="px-3 py-1">
                <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2">
                  <span />
                  <span />
                  <span />
                  <span className={SCORE_BADGE_CLASS}>{successLabel}</span>
                  <span />
                </div>
              </div>
              <div className="rounded-md border bg-card/50">
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
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleOneEmail(entry.email, v)}
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
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`font-mono truncate ${emailTint}`}>{displayEmail}</span>
                            {isPaid && (
                              <>
                                <span className={TAG_CLASS}>{entry.title}</span>
                                <span className={TAG_CLASS}>
                                  {t("premiumContacts.yearsLabel", { count: entry.yearsOfExperience })}{" "}
                                  {t("premiumContacts.atCompany")} {entry.companyDisplayName} {entry.countryCode}
                                </span>
                              </>
                            )}
                          </div>
                          <div className={`truncate ${entry.visible ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground"}`}>
                            {entry.visible ? entry.title : entry.fullName}
                          </div>
                        </div>

                        <span className={SCORE_BADGE_CLASS}>{entry.score}%</span>

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
                            aria-label={entry.visible ? "Copier l'email" : "Débloquer pour copier"}
                            title={entry.visible ? "Copier l'email" : "Débloquer pour copier"}
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

          {(forms.length > 0 || links.length > 0) && (
            <section className="pt-2">
              <h3 className="font-semibold mb-2 text-lg">{t("resultsDisplay.otherOptionsLabel")}</h3>
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

          <section className="pt-2">
            <h3 className="font-semibold mb-2 text-lg">{t("resultsDisplay.generatedEmailLabel")}</h3>

            <div className="space-y-4">
              <div>
                <div className="mb-1 text-sm font-medium">{t("resultsDisplay.subjectLabel")}</div>
                <div className="flex justify-end pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(subject, "resultsDisplay.copySubject")}
                    aria-label={t("resultsDisplay.copySubject") as string}
                    title={t("resultsDisplay.copySubject") as string}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Input readOnly value={subject} className="font-mono w-full" />
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">{t("resultsDisplay.bodyLabel")}</div>
                <div className="flex justify-end pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(body, "resultsDisplay.copyBody")}
                    aria-label={t("resultsDisplay.copyBody") as string}
                    title={t("resultsDisplay.copyBody") as string}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea readOnly value={body} rows={10} className="font-mono w-full" />
              </div>

              <div className="flex justify-end">
                <OffsetButton
                  onClick={handleOpenEmailApp}
                  disabled={!mailtoLink}
                  className="w-full sm:w-auto"
                >
                  {t("resultsDisplay.openInEmailAppButton")}
                </OffsetButton>
              </div>
            </div>
          </section>

          {hasImage && (
            <p
              className="text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md"
              dangerouslySetInnerHTML={{ __html: t("resultsDisplay.imageReminder") }}
            />
          )}

          {mockPhoneEntries.length > 0 && (
            <section className="pt-2">
              <div className="mb-3">
                <h3 className="font-semibold text-lg">{t("resultsDisplay.phoneNumbersLabel")}</h3>
              </div>
              <div className="px-3 py-1">
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                  <span />
                  <span />
                  <span className={SCORE_BADGE_CLASS}>{successLabel}</span>
                  <span />
                </div>
              </div>
              <div className="rounded-md border bg-card/50">
                <ul className="divide-y">
                  {mockPhoneEntries.map((entry, i) => {
                    const isPaid = !entry.visible;
                    const rowTint = isPaid ? "bg-blue-50/40 dark:bg-blue-950/20" : "";
                    const numberTint = isPaid ? "text-blue-700 dark:text-blue-300 font-medium" : "";

                    return (
                      <li
                        key={`phone-${i}-${entry.number}`}
                        className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-3 py-2 ${entry.visible ? "text-sm" : "text-xs"} ${rowTint}`}
                        title={entry.number}
                        aria-label={entry.number}
                      >
                        {entry.visible ? (
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-white/10">
                            <AvatarImage src={entry.avatarUrl} alt={entry.fullName} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className={`font-mono truncate ${numberTint}`}>{entry.number}</span>
                            {isPaid && (
                              <>
                                <span className={TAG_CLASS}>{entry.type}</span>
                                <span className={TAG_CLASS}>
                                  {t("premiumContacts.yearsLabel", { count: entry.yearsOfExperience })}{" "}
                                  {t("premiumContacts.atCompany")} {entry.companyDisplayName} {entry.countryCode}
                                </span>
                              </>
                            )}
                          </div>
                          <div className={`truncate ${entry.visible ? "text-xs text-muted-foreground" : "text-[11px] text-muted-foreground"}`}>
                            {entry.visible ? entry.type : entry.fullName}
                          </div>
                        </div>

                        <span className={SCORE_BADGE_CLASS}>{entry.score}%</span>

                        <div className="flex items-center gap-1 justify-self-end">
                          {entry.visible ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopy(entry.number, "resultsDisplay.copyPhone")}
                              aria-label={t("resultsDisplay.copyPhone") as string}
                              title={t("resultsDisplay.copyPhone") as string}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => setUnlockOpen(true)}
                              aria-label="Débloquer pour copier"
                              title="Débloquer pour copier"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}
        </CardContent>
      </Card>

      <UnlockPremiumDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};