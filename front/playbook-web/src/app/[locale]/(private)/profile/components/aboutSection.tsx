import { PlayText } from "@/components/ui/Text";
import React from "react";

export const AboutSection: React.FC<{
  bio?: string;
}> = ({ bio }) => {
  return (
    <div className="order-2 md:order-1 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-xl flex flex-col gap-4 h-full justify-between">
      <div className="space-y-3">
        <PlayText.Primary
          id="about-me"
          className="text-lg font-bold text-white tracking-wide"
        />

        <PlayText.Primary
          content={bio}
          className="text-sm text-slate-300 leading-relaxed"
        />
      </div>
    </div>
  );
};
