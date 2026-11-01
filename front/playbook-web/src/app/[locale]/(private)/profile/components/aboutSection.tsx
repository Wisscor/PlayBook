import { PlayText } from "@/components/ui/Text";
import { COMING_FROM } from "@/lib/constants";
import React from "react";

export const AboutSection: React.FC<{
  bio?: string;
  comingFrom: COMING_FROM;
}> = ({ bio, comingFrom }) => {
  return (
    <div className="group relative order-2 flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/15 sm:p-8 md:order-1">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60"
      />

      <div className="relative space-y-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id={comingFrom == COMING_FROM.ME ? "about-me" : "about"}
            className="text-lg font-bold tracking-wide text-stone-100"
          />
        </div>

        <PlayText.Primary
          content={bio}
          className="text-sm leading-relaxed text-stone-300 wrap-break-word"
        />
      </div>
    </div>
  );
};
