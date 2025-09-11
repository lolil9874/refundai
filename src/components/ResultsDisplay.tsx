import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Lock, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import OffsetButton from "@/components/OffsetButton";
import React from "react";
import { cn } from "@/lib/utils";
import UnlockPremiumDialog from "@/components/UnlockPremiumDialog";
import { Badge } from "@/components/ui/badge";
import PremiumContactCard, { type PremiumContact } from "@/components/PremiumContactCard";

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
};

export type { PremiumContact };

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage, phones, premiumContacts = [] } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t("resultsDisplay.copySuccess", { type }));
  };

  // Construire la liste des 5 e-mails (1 meilleur + 4 suivants)
  const topFive = React.useMemo(() => {
    const uniq = new Set<string>();
    if (bestEmail) uniq.add(bestEmail);
    ranked.forEach((e) => {
      if (uniq.size < 5) uniq.add(e);
    });
    return Array.from(uniq).slice(0, 5);
  }, [bestEmail, ranked]);

  const visibleEmails = topFive.slice(0, 2);
  const lockedEmails = topFive.slice(2, 5);

  // Scores: plus élevés pour visibles, plus bas pour verrouillés
  const visibleScores = [92, 88];
  const lockedScores = [74, 71, 68];

  const recipients = visibleEmails;

  const mailtoLink = `mailto:${encodeURIComponent(recipients.join(","))}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  const [unlockOpen, setUnlockOpen] = React.useState(false);

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
          {(topFive.length > 0 || forms.length > 0 || links.length > 0) && (
            <div className="space-y-4">
              {topFive.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      {t("resultsDisplay.emailsToContactLabel")}
                    </h3>
                  </div>

                  {/* Une seule ligne, responsive (scroll horizontal) */}
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 whitespace-nowrap snap-x snap-mandatory pr-1">
                      {visibleEmails.map((email, idx) => (
                        <div
                          key={`vis-${email}`}
                          className={cn(
                            "snap-start inline-flex items-center gap-2 rounded-full border px-3 py-2 bg-sky-50 text-sky-800 dark:bg-sky-950/30 dark:text-sky-200 border-sky-200 dark:border-sky-900",
                            "shrink-0"
                          )}
                          title={email}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="font-mono text-sm truncate max-w-[180px] sm:max-w-[220px]">{email}</span>
                          <Badge variant="secondary" className="text-[11px]">
                            Score {visibleScores[idx] ?? 85}
                          </Badge>
                        </div>
                      ))}

                      {lockedEmails.map((email, idx) => (
                        <button
                          type="button"
                          onClick={() => setUnlockOpen(true)}
                          key={`lock-${email}`}
                          className={cn(
                            "snap-start inline-flex items-center gap-2 rounded-full border px-3 py-2 bg-muted/50 text-muted-foreground",
                            "hover:bg-muted hover:text-foreground transition-colors",
                            "shrink-0"
                          )}
                          title={email}
                        >
                          <Lock className="h-4 w-4" />
                          <span className="font-mono text-sm truncate max-w-[180px] sm:max-w-[220px]">{email}</span>
                          <Badge variant="outline" className="text-[11px]">
                            Score {lockedScores[idx] ?? 70}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(forms.length > 0 || links.length > 0) && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">
                    {t("resultsDisplay.otherOptionsLabel")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {forms.map((form, i) => (
                      <li
                        key={`f-${i}`}
                        className="animate-in fade-in slide-in-from-bottom-2 flex items-center"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a
                          href={form}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("resultsDisplay.contactForm")}
                        </a>
                      </li>
                    ))}
                    {links.map((link, i) => (
                      <li
                        key={`l-${i}`}
                        className="animate-in fade-in slide-in-from-bottom-2 flex items-center"
                        style={{
                          animationDelay: `${(forms.length + i) * 60}ms`,
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("resultsDisplay.supportPage")}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {phones.length > 0 && (
            <div className="pt-2">
              <h3 className="font-semibold mb-3 text-lg">
                {t("resultsDisplay.phoneNumbersLabel")}
              </h3>
              <ul className="space-y-2">
                {phones.map((num, i) => (
                  <li
                    key={`p-${i}`}
                    className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${num.replace(/\s+/g, "")}`} className="hover:underline">
                        {num}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(num, "resultsDisplay.copyPhone")}
                      aria-label={t("resultsDisplay.copyPhone") as string}
                      title={t("resultsDisplay.copyPhone") as string}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {premiumContacts.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">
                  {t("premiumContacts.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("premiumContacts.subtitle")}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {premiumContacts.map((c, idx) => (
                  <PremiumContactCard
                    key={`${c.emailMasked}-${idx}`}
                    contact={c}
                    onUnlock={() => setUnlockOpen(true)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4 text-lg">
              {t("resultsDisplay.generatedEmailLabel")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("resultsDisplay.subjectLabel")}
                </label>
                <div className="relative mt-1">
                  <p className="p-3 pr-12 bg-muted/50 rounded-md font-medium">
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
                  <div className="p-3 pr-12 h-64 overflow-y-auto bg-muted/50 rounded-md whitespace-pre-wrap text-sm font-mono leading-relaxed">
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <OffsetButton
              href={mailtoLink}
              className="w-full"
              aria-disabled={recipients.length === 0}
            >
              {t("resultsDisplay.openInEmailAppButton")}
            </OffsetButton>
          </div>
          {hasImage && (
            <p
              className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md"
              dangerouslySetInnerHTML={{ __html: t("resultsDisplay.imageReminder") }}
            />
          )}
        </CardContent>
      </Card>

      <UnlockPremiumDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
    </>
  );
};