"use client";

import React from "react";
import { PlayText } from "./Text";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface PlayListPrimaryProps<T = any> {
  toggle: () => void;
  isOpen: boolean;
  text: string;
  items: T[];
  choseItem: (item: T) => void;
  value?: keyof T | string;
}

const Primary = <T extends Record<string, any> | string | number>({
  toggle,
  isOpen,
  text,
  items,
  choseItem,
  value,
}: PlayListPrimaryProps<T>) => {
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={toggle}
        className={`group flex w-full cursor-pointer items-center justify-between border px-5 py-3.5 backdrop-blur-md transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          isOpen
            ? "rounded-t-2xl border-primary/60 border-b-transparent bg-secondary/40 shadow-lg shadow-primary/10"
            : "rounded-2xl border-white/10 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/40"
        }`}
      >
        <PlayText.Primary
          content={text}
          className="text-sm font-medium text-stone-100"
        />

        <ExpandMoreIcon
          className={`h-5 w-5 transition-all duration-300 ${
            isOpen
              ? "rotate-180 text-amber-200"
              : "text-stone-400 group-hover:text-stone-200"
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 rounded-b-2xl border border-t-0 border-primary/60 bg-neutral-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {items.map((item, index) => {
              let displayContent: string;

              if (typeof item === "object" && item !== null) {
                displayContent = value
                  ? String(item[value as keyof typeof item])
                  : JSON.stringify(item);
              } else {
                displayContent = String(item);
              }

              return (
                <button
                  type="button"
                  key={displayContent || index}
                  onClick={() => choseItem(item)}
                  className="group relative flex w-full cursor-pointer items-center overflow-hidden rounded-xl px-3 py-2.5 text-start transition-all duration-200 hover:bg-linear-to-r hover:from-primary/30 hover:to-extra/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-2 inset-s-0 w-0.5 origin-center scale-y-0 rounded-full bg-primary transition-transform duration-200 group-hover:scale-y-100"
                  />
                  <span className="transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                    <PlayText.Primary
                      content={displayContent}
                      className="text-sm font-medium text-stone-300 transition-colors group-hover:text-white"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayList = {
  Primary,
};
