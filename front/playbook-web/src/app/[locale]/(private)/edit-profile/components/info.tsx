"use client";

import { PlayLabel } from "@/components/ui/Label";
import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { JSX } from "react";

export const Info: React.FC<{
  label: string;
  value?: string;
  onClick: () => void;
  isEditing: boolean;
  input: JSX.Element;
}> = ({ label, value, onClick, isEditing, input }) => {
  const t = useTranslations();

  return (
    <div
      className={`group flex w-full min-w-0 flex-col gap-2.5 rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 ${
        isEditing
          ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
          : "border-white/10 bg-neutral-950/30 hover:border-primary/30"
      }`}
    >
      <PlayText.Primary
        id={label}
        className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
          isEditing ? "text-amber-200" : "text-amber-200/70"
        }`}
      />

      <div className="flex w-full flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 self-center">
          {isEditing ? (
            <PlayLabel.Primary>{input}</PlayLabel.Primary>
          ) : (
            <PlayText.Primary
              content={value || t("not-set")}
              className={`line-clamp-3 text-sm font-medium wrap-break-word ${
                value ? "text-stone-100" : "text-amber-300"
              }`}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onClick}
          className={`group/btn flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:translate-y-0 active:scale-90 ${
            isEditing
              ? "border-primary bg-primary/30 shadow-lg shadow-primary/20"
              : "border-white/10 bg-secondary/30"
          }`}
          aria-label="Edit info"
        >
          <Image
            alt="edit"
            src="/icons/edit.png"
            width={16}
            height={16}
            className="shrink-0 opacity-80 invert transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:opacity-100"
          />
        </button>
      </div>
    </div>
  );
};
