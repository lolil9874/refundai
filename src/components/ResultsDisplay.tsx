import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";

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
  const { bestEmail, ranked, forms, links, subject, body, hasImage } = results;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const mailtoLink = `mailto:${bestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Card className="mt-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle>2. Your Refund Request</CardTitle>
        <CardDescription>
          We've generated an email and found the best contact methods for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Recommended Contact</h3>
          {bestEmail ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md animate-in fade-in-50">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-mono text-green-800 dark:text-green-300">{bestEmail}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">We couldn't find a specific email. Try using a contact form.</p>
          )}
        </div>

        {(ranked.length > 0 || forms.length > 0 || links.length > 0) && (
          <div>
            <h3 className="font-semibold mb-2">Other Options</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {ranked.map((email, i) => <li key={`e-${i}`} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 60}ms` }}><a href={`mailto:${email}`} className="text-blue-500 hover:underline">{email}</a></li>)}
              {forms.map((form, i) => <li key={`f-${i}`} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${(ranked.length + i) * 60}ms` }}><a href={form} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Contact Form</a></li>)}
              {links.map((link, i) => <li key={`l-${i}`} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${(ranked.length + forms.length + i) * 60}ms` }}><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Support Page</a></li>)}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">Generated Email</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <div className="relative mt-1">
                <p className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-medium">{subject}</p>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8" onClick={() => handleCopy(subject, "Subject")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Body</label>
              <div className="relative mt-1">
                <div className="p-3 h-64 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-md whitespace-pre-wrap text-sm">
                  {body}
                </div>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8" onClick={() => handleCopy(body, "Email body")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <Button asChild className="w-full transition-transform active:scale-[0.98]" size="lg">
            <a href={mailtoLink}>
              <Mail className="mr-2 h-5 w-5" /> Open in Email App
            </a>
          </Button>
        </div>
        {hasImage && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
            <strong>Reminder:</strong> Don't forget to attach your image in your mail app!
          </p>
        )}
      </CardContent>
    </Card>
  );
};