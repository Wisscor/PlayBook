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
        className={`flex w-full cursor-pointer items-center justify-between border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-md transition-all duration-200 outline-none hover:border-white/20 hover:bg-white/10 ${
          isOpen ? "rounded-t-2xl border-b-transparent" : "rounded-2xl"
        }`}
      >
        <PlayText.Primary
          content={text}
          className="text-sm font-medium text-white"
        />

        <ExpandMoreIcon
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100 pointer-events-auto"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 rounded-b-2xl border border-t-0 border-white/10 bg-slate-950/90 p-2 backdrop-blur-xl shadow-2xl">
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
                  className="flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-white/10"
                >
                  <PlayText.Primary
                    content={displayContent}
                    className="text-sm font-medium text-slate-200 hover:text-white"
                  />
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
