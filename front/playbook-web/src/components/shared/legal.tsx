import { Header } from "@/components/shared/Header";
import { PlayText } from "@/components/ui/Text";
import React from "react";

export const LegalPage: React.FC<{
  titleId: string;
  date: string;
  children: React.ReactNode;
}> = ({ titleId, date, children }) => (
  <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 px-6 py-8 text-stone-100 md:px-12 lg:px-20 lg:py-10">
    <style>{`
      @keyframes lg-in {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes lg-float {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50%      { transform: translate3d(30px, -22px, 0) scale(1.1); }
      }
      @keyframes lg-sheen {
        from { background-position: 0% 50%; }
        to   { background-position: 200% 50%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .lg-anim { animation: none !important; }
      }
    `}</style>

    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="lg-anim absolute -inset-s-32 -top-40 h-112 w-md rounded-full bg-primary/30 blur-3xl animate-[lg-float_16s_ease-in-out_infinite]" />
      <div className="lg-anim absolute -bottom-48 -inset-e-24 h-120 w-120 rounded-full bg-extra/30 blur-3xl animate-[lg-float_20s_ease-in-out_infinite_reverse]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>

    <main className="relative z-10 flex flex-1 flex-col gap-10">
      <Header />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-10">
        <div className="lg-anim flex flex-col items-start gap-3 border-b border-white/10 pb-6 animate-[lg-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards]">
          <PlayText.Primary
            id={titleId}
            className="lg-anim bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-size-[200%_100%] bg-clip-text text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-transparent animate-[lg-sheen_7s_linear_infinite] sm:text-5xl"
          />
          <PlayText.Primary
            id="last-updated"
            values={{ date }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-400"
          />
        </div>

        <div className="flex flex-col gap-5 text-sm leading-relaxed text-stone-300">
          {children}
        </div>
      </div>
    </main>
  </div>
);

export const LegalSection: React.FC<{
  titleId: string;
  mark: string;
  index?: number;
  children: React.ReactNode;
}> = ({ titleId, mark, index = 0, children }) => (
  <section
    style={{ animationDelay: `${0.1 + index * 0.08}s` }}
    className="lg-anim group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 animate-[lg-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards] hover:border-primary/40 hover:bg-primary/10"
  >
    <span
      aria-hidden
      className="absolute inset-y-6 inset-s-0 w-1 rounded-e-full bg-linear-to-b from-primary to-extra"
    />
    <PlayText.Primary
      id={titleId}
      values={{ mark }}
      className="text-base font-bold text-amber-100 sm:text-lg"
    />
    {children}
  </section>
);
