"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type CustomFileInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value?: File | null;
  onChange: (file: File | null) => void;
};

export function CustomFileInput({ value, onChange, ...props }: CustomFileInputProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
  };

  const handleRemoveFile = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Input
        {...props}
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
      />
      {!value ? (
        <label
          htmlFor={inputId}
          className={cn(
            buttonVariants({ variant: "outline" }),
            props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          {t("refundForm.imageUpload.buttonText")}
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{value.name}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} disabled={props.disabled} className="h-6 w-6 flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}