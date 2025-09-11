"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function UnlockPremiumDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("premiumContacts.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("premiumContacts.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              toast.info(t("premiumContacts.ctaToast") as string);
              onOpenChange(false);
            }}
          >
            {t("premiumContacts.discoverPlans")}
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            {t("premiumContacts.notNow")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}