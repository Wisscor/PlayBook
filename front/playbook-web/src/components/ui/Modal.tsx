"use client";

import { PlayText } from "@/components/ui/Text";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";

export const Primary: React.FC<{
  close: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  title: string;
}> = ({ close, isOpen, children, title }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 px-4 backdrop-blur-md transition-all duration-500 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`relative w-full max-w-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-6 scale-95 opacity-0"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-4xl bg-linear-to-br from-primary/30 via-extra/20 to-secondary/30 opacity-70 blur-2xl"
        />

        <div className="relative flex w-full flex-col gap-6 rounded-3xl border border-primary/25 bg-neutral-950/95 p-6 text-stone-100 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent"
          />

          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
              />
              <PlayText.Primary
                id={title}
                className="text-xl font-bold tracking-tight text-stone-100"
              />
            </div>
            <button
              type="button"
              onClick={close}
              className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/30 text-stone-400 transition-all duration-300 hover:border-primary/60 hover:bg-primary/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90"
              aria-label="Close modal"
            >
              <CloseIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const PlayModal = {
  Primary,
};
