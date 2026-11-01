"use client";

import { Header } from "@/components/shared/Header";
import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { Link } from "../../../i18n/navigation";

const features = [
  {
    title: "make-matche-room",
    description: "make-matche-room-description",
    icon: (
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1L12 2z" />
    ),
  },
  {
    title: "make-post",
    description: "make-post-description",
    icon: (
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    ),
  },
  {
    title: "go-to-community",
    description: "go-to-community-description",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 21v-1a6 6 0 0112 0v1M16 4.5a3.5 3.5 0 010 7M22 21v-1a6 6 0 00-4-5.6" />
      </>
    ),
  },
];

export const Home = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 px-6 py-8 text-stone-100 md:px-12 lg:px-20 lg:py-10">
      <style>{`
        @keyframes hm-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hm-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(32px, -24px, 0) scale(1.1); }
        }
        @keyframes hm-sheen {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-anim { animation: none !important; }
        }
      `}</style>

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hm-anim absolute -inset-s-32 -top-40 h-120 w-120 rounded-full bg-primary/40 blur-3xl animate-[hm-float_16s_ease-in-out_infinite]" />
        <div className="hm-anim absolute -bottom-48 -inset-e-24 h-128 w-lg rounded-full bg-extra/40 blur-3xl animate-[hm-float_20s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col gap-10">
        <Header />

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 py-6">
          <section className="flex flex-col items-center gap-6 text-center">
            <PlayText.Primary
              id="slogan"
              className="hm-anim rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-200 animate-[hm-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]"
            />

            <PlayText.Primary
              id="home-title"
              className="hm-anim max-w-3xl bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-size-[200%_100%] bg-clip-text text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent animate-[hm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_backwards,hm-sheen_7s_linear_infinite] sm:text-5xl lg:text-7xl"
            />

            <PlayText.Primary
              id="home-subtitle"
              className="hm-anim max-w-2xl text-pretty text-base leading-relaxed text-stone-300/80 animate-[hm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_backwards] sm:text-lg"
            />

            <div className="hm-anim mt-2 flex w-full flex-col items-center justify-center gap-3 animate-[hm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.24s_backwards] sm:w-auto sm:flex-row">
              <Link
                href={ROUTES.SIGNIN}
                className="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-primary to-extra px-8 py-3.5 shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 sm:w-auto"
              >
                <PlayText.Primary
                  id="login"
                  className="text-sm font-semibold text-white"
                />
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 sm:w-auto"
              >
                <PlayText.Primary
                  id="signup"
                  className="text-sm font-semibold text-stone-100"
                />
              </Link>
            </div>
          </section>

          <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature, i) => (
              <article
                key={feature.title}
                style={{ animationDelay: `${0.35 + i * 0.1}s` }}
                className="hm-anim group relative overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-6 backdrop-blur-xl transition-all duration-300 animate-[hm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards] hover:-translate-y-1.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-2xl hover:shadow-primary/20"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-white"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <PlayText.Primary
                  id={feature.title}
                  className="text-lg font-extrabold tracking-tight text-stone-100 transition-colors duration-300 group-hover:text-amber-100"
                />
                <PlayText.Primary
                  id={feature.description}
                  className="mt-2 text-sm leading-relaxed text-stone-400"
                />
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
