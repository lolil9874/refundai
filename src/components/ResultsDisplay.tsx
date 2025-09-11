import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, ExternalLink, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import OffsetButton from "@/components/OffsetButton";
import React from "react";
import { cn } from "@/lib/utils";
import PremiumContactCard, { type PremiumContact } from "@/components/PremiumContactCard";
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

  const allEmails = React.useMemo(() => {
    const uniq = new Set<string>();
    if (bestEmail) uniq.add(bestEmail);
    ranked.forEach((e) => uniq.add(e));
    return Array.from(uniq);
  }, [bestEmail, ranked]);

  const [selectedEmails, setSelectedEmails] = React.useState<string[]>(
    bestEmail ? [bestEmail] : []
  );

  const toggleEmail = (email: string, checked: boolean) => {
    setSelectedEmails((prev) => {
      if (checked) {
        if (prev.includes(email)) return prev;
        return [...prev, email];
      }
      return prev.filter((e) => e !== email);
    });
  };

  const allSelected = selectedEmails.length === allEmails.length && allEmails.length > 0;
  const toggleAll = () => {
    setSelectedEmails((prev) =>
      prev.length === allEmails.length ? [] : allEmails
    );
  };

  const recipients = selectedEmails.length
    ? selectedEmails
    : bestEmail
      ? [bestEmail]
      : [];

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
          {(allEmails.length > 0 || forms.length > 0 || links.length > 0) && (
            <div className="space-y-4">
              {allEmails.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      {t("resultsDisplay.emailsToContactLabel")}
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleAll}
                    >
                      {allSelected
                        ? t("resultsDisplay.unselectAll")
                        : t("resultsDisplay.selectAll")}
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {allEmails.map((email, i) => {
                      const checked = selectedEmails.includes(email);
                      const isBest = email === bestEmail;
                      return (
                        <li
                          key={email}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md border transition-colors",
                            isBest
                              ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-300"
                              : "bg-muted/30"
                          )}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <Checkbox
                            id={`chk-${i}`}
                            checked={checked}
                            onCheckedChange={(v) => toggleEmail(email, !!v)}
                          />
                          <label
                            htmlFor={`chk-${i}`}
                            className={cn(
                              "text-sm font-mono cursor-pointer",
                              isBest && "text-sky-700 dark:text-sky-300"
                            )}
                          >
                            {email}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
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