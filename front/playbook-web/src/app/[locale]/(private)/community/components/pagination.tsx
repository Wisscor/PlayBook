import { PlayText } from "@/components/ui/Text";
import React from "react";

export const Pagination: React.FC<{
  page: number;
  pages: number;
  onPrevious: () => void;
  onNext: () => void;
}> = ({ page, pages, onPrevious, onNext }) => {
  if (pages <= 1 && page <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
      {page > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <PlayText.Primary
            id="previous"
            className="text-sm text-stone-300 transition-colors group-hover:text-white"
          />
        </button>
      )}

      <PlayText.Primary
        content={pages > 0 ? `${page}/${pages}` : page.toString()}
        className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
      />

      {page < pages && (
        <button
          type="button"
          onClick={onNext}
          className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
        >
          <PlayText.Primary
            id="next"
            className="text-sm text-stone-300 transition-colors group-hover:text-white"
          />
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};
