import { PlayText } from "@/components/ui/Text";
import React from "react";

export const SectionTitle: React.FC<{
  id: string;
  count?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ id, count, children }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="h-7 w-1.5 shrink-0 rounded-full bg-linear-to-b from-primary to-extra"
        />
        <PlayText.Primary
          id={id}
          className="truncate text-xl font-extrabold tracking-tight text-stone-100 sm:text-2xl"
        />
        {count !== undefined && (
          <div className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-3 py-0.5 text-xs font-semibold tabular-nums text-amber-200">
            {count}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
