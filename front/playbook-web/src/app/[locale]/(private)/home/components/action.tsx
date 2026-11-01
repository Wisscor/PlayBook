import { PlayText } from "@/components/ui/Text";
import Image from "next/image";
import React, { FC } from "react";

export const Action: FC<{
  action: {
    action: string;
    description: string;
    icon: string;
    onClick: () => void;
  };
}> = ({ action }) => {
  return (
    <button
      onClick={() => action.onClick()}
      className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-secondary/25 p-8 text-center shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-0 active:scale-[0.98]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/25 via-transparent to-extra/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />

      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-primary/50">
        <Image
          alt={action.action}
          src={action.icon}
          width={32}
          height={32}
          className="object-contain drop-shadow"
        />
      </div>

      <div className="relative flex flex-col gap-2">
        <PlayText.Primary
          id={action.action}
          className="text-lg font-bold tracking-tight text-stone-100 transition-colors group-hover:text-white"
        />
        <PlayText.Primary
          id={action.description}
          className="text-xs leading-relaxed text-stone-400 transition-colors group-hover:text-stone-300"
        />
      </div>

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative h-5 w-5 -translate-x-2 text-amber-200 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
};
