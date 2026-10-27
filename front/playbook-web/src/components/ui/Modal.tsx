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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 transition-all duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`relative flex w-full max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/90 p-6 sm:p-8 text-white backdrop-blur-2xl shadow-2xl transition-all duration-300 ease-out transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 -translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <PlayText.Primary
            id={title}
            className="text-xl font-bold tracking-tight text-white"
          />
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export const PlayModal = {
  Primary,
};
