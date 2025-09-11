import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Mail, ExternalLink, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import OffsetButton from "@/components/OffsetButton";
import React from "react";

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

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage, phones } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t("resultsDisplay.copySuccess", { type }));
  };

  // Liste unique d'emails (meilleur + autres)
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

  return (
    <Card className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("resultsDisplay.title")}
        </CardTitle>
        <CardDescription>{t("resultsDisplay.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="font-semibold mb-3 text-lg">
            {t("resultsDisplay.recommendedContactLabel")}
          </h3>
          {bestEmail ? (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in-50">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-mono text-primary font-medium">
                {bestEmail}
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-primary/15 text-primary">
                {t("resultsDisplay.recommended")}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("resultsDisplay.noEmailFound")}
            </p>
          )}
        </div>

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
                        className="flex items-center gap-3 p-2 rounded-md border bg-muted/30"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <Checkbox
                          id={`chk-${i}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleEmail(email, !!v)}
                        />
                        <label
                          htmlFor={`chk-${i}`}
                          className="text-sm font-mono cursor-pointer"
                        >
                          {email}
                        </label>
                        {isBest && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {t("resultsDisplay.recommended")}
                          </span>
                        )}
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
            <Mail className="mr-2 h-5 w-5" /> {t("resultsDisplay.openInEmailAppButton")}
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
  );
};