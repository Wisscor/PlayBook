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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 sm:gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all">
      <PlayText.Primary
        id={label}
        className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:min-w-27.5"
      />

      <div className="flex items-center justify-between gap-3 flex-1 w-full overflow-hidden">
        <div className="flex-1 min-w-0 ">
          {isEditing ? (
            <PlayLabel.Primary>{input}</PlayLabel.Primary>
          ) : (
            <PlayText.Primary
              content={value || t("not-set")}
              className={`text-sm font-medium truncate ${
                value ? "text-slate-200" : "text-amber-400"
              }`}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white cursor-pointer active:scale-95"
          aria-label="Edit info"
        >
          <Image
            alt="edit"
            src="/icons/edit.png"
            width={16}
            height={16}
            className="opacity-80 invert shrink-0"
          />
        </button>
      </div>
    </div>
  );
};
