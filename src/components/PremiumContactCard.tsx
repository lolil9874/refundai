"use client";

import React from "react";
import { Mail, Phone, Lock, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type PremiumContact = {
  name: string;
  title: string;
  department?: string;
  company: string;
  emailMasked: string;
  phoneMasked?: string;
  avatarUrl?: string;
  location?: string;
  score?: number;
  tags?: string[];
};

type Props = {
  contact: PremiumContact;
  onUnlock: () => void;
  className?: string;
};

export default function PremiumContactCard({ contact, onUnlock, className }: Props) {
  const { t } = useTranslation();

  const initials = React.useMemo(() => {
    const parts = contact.name.split(" ");
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
    return letters.join("");
  }, [contact.name]);

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card/60 dark:bg-card/40 backdrop-blur-xl p-4 shadow-sm",
        "flex gap-4 items-start",
        className
      )}
    >
      {/* Ruban verrouillé */}
      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary dark:text-primary">
        <Lock className="h-3.5 w-3.5" />
        <span>{t("premiumContacts.lockedBadge")}</span>
      </div>

      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/20">
        {contact.avatarUrl ? (
          <AvatarImage src={contact.avatarUrl} alt={contact.name} className="object-cover" />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold truncate">{contact.name}</p>
          {typeof contact.score === "number" && (
            <span className="inline-flex items-center gap-1 text-xs rounded-md bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary px-2 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {contact.score}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {contact.title}
          {contact.department ? ` · ${contact.department}` : ""} · {contact.company}
          {contact.location ? ` · ${contact.location}` : ""}
        </p>

        {!!contact.tags?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contact.tags!.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{contact.emailMasked}</span>
          </div>
          {contact.phoneMasked && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{contact.phoneMasked}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Button onClick={onUnlock} className="whitespace-nowrap">
          {t("premiumContacts.unlockCta")}
        </Button>
      </div>
    </div>
  );
}