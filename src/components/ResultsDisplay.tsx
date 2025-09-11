import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import OffsetButton from "@/components/OffsetButton";

type RefundResult = {
  bestEmail: string;
  ranked: string[];
  forms: string[];
  links: string[];
  subject: string;
  body: string;
  hasImage: boolean;
};

export const ResultsDisplay = ({ results }: { results: RefundResult }) => {
  const { t } = useTranslation();
  const { bestEmail, ranked, forms, links, subject, body, hasImage } = results;

  const handleCopy = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    const type = t(typeKey);
    toast.success(t('resultsDisplay.copySuccess', { type }));
  };

  const mailtoLink = `mailto:${bestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Card className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">{t('resultsDisplay.title')}</CardTitle>
        <CardDescription>
          {t('resultsDisplay.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="font-semibold mb-3 text-lg">{t('resultsDisplay.recommendedContactLabel')}</h3>
          {bestEmail ? (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in-50">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-mono text-primary font-medium">{bestEmail}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('resultsDisplay.noEmailFound')}</p>
          )}
        </div>

        {(ranked.length > 0 || forms.length > 0 || links.length > 0) && (
          <div>
            <h3 className="font-semibold mb-3 text-lg">{t('resultsDisplay.otherOptionsLabel')}</h3>
            <ul className="space-y-2 text-sm">
              {ranked.map((email, i) => (
                <li key={`e-${i}`} className="animate-in fade-in slide-in-from-bottom-2 flex items-center" style={{ animationDelay: `${i * 60}ms` }}>
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
                </li>
              ))}
              {forms.map((form, i) => (
                <li key={`f-${i}`} className="animate-in fade-in slide-in-from-bottom-2 flex items-center" style={{ animationDelay: `${(ranked.length + i) * 60}ms` }}>
                  <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={form} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('resultsDisplay.contactForm')}</a>
                </li>
              ))}
              {links.map((link, i) => (
                <li key={`l-${i}`} className="animate-in fade-in slide-in-from-bottom-2 flex items-center" style={{ animationDelay: `${(ranked.length + forms.length + i) * 60}ms` }}>
                  <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t('resultsDisplay.supportPage')}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-4 text-lg">{t('resultsDisplay.generatedEmailLabel')}</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('resultsDisplay.subjectLabel')}</label>
              <div className="relative mt-1">
                <p className="p-3 pr-12 bg-muted/50 rounded-md font-medium">{subject}</p>
                <Button variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(subject, "resultsDisplay.copySubject")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">{t('resultsDisplay.bodyLabel')}</label>
              <div className="relative mt-1">
                <div className="p-3 pr-12 h-64 overflow-y-auto bg-muted/50 rounded-md whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {body}
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-1 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleCopy(body, "resultsDisplay.copyBody")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <OffsetButton href={mailtoLink} className="w-full">
            <Mail className="mr-2 h-5 w-5" /> {t('resultsDisplay.openInEmailAppButton')}
          </OffsetButton>
        </div>
        {hasImage && (
          <p 
            className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md"
            dangerouslySetInnerHTML={{ __html: t('resultsDisplay.imageReminder') }}
          />
        )}
      </CardContent>
    </Card>
  );
};