"use client";

import { Header } from "@/components/shared/Header";
import { PlayText } from "@/components/ui/Text";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignIn } from "./components/signIn";
import { SignUp } from "./components/signUp";

const features = ["make-matche-room", "make-post", "go-to-community"];

const AuthPage = () => {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "signin";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-950 px-6 py-8 text-stone-100 md:px-12 lg:px-20 lg:py-10">
      <style>{`
        @keyframes au-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes au-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(30px, -24px, 0) scale(1.1); }
        }
        @keyframes au-sheen {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .au-anim { animation: none !important; }
        }
      `}</style>

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="au-anim absolute -inset-s-32 -top-40 h-112 w-md rounded-full bg-primary/40 blur-3xl animate-[au-float_16s_ease-in-out_infinite]" />
        <div className="au-anim absolute -bottom-48 -inset-e-24 h-120 w-120 rounded-full bg-extra/40 blur-3xl animate-[au-float_20s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col">
        <div className="w-full">
          <Header />
        </div>

        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-8 lg:grid-cols-2 lg:gap-16">
          <section className="flex flex-col items-start gap-6">
            <PlayText.Primary
              id="welcome"
              className="au-anim bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-size-[200%_100%] bg-clip-text text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent animate-[au-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards,au-sheen_7s_linear_infinite] sm:text-5xl lg:text-6xl"
            />
            <PlayText.Primary
              id="slogan"
              className="au-anim max-w-md text-pretty text-base leading-relaxed text-stone-300/80 animate-[au-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_backwards] sm:text-lg"
            />

            <ul className="hidden flex-col gap-3 lg:flex">
              {features.map((id, i) => (
                <li
                  key={id}
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                  className="au-anim flex items-center gap-3 animate-[au-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30">
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-white"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <PlayText.Primary
                    id={id}
                    className="text-sm font-semibold text-stone-200"
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="au-anim mx-auto flex w-full max-w-md flex-col gap-6 rounded-4xl border border-primary/25 bg-secondary/20 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[au-in_0.8s_cubic-bezier(0.22,1,0.36,1)_0.15s_backwards] sm:p-8 lg:mx-0 lg:ms-auto">
            <div
              role="tablist"
              className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-neutral-950/40 p-1"
            >
              {[
                { key: "signin", label: "login" },
                { key: "signup", label: "signup" },
              ].map((tab) => (
                <Link
                  key={tab.key}
                  href={`?mode=${tab.key}`}
                  role="tab"
                  aria-selected={mode === tab.key}
                  replace
                  scroll={false}
                  className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    mode === tab.key
                      ? "bg-linear-to-r from-primary to-extra text-white shadow-lg shadow-primary/30"
                      : "text-stone-400 hover:text-amber-100"
                  }`}
                >
                  <PlayText.Primary id={tab.label} />
                </Link>
              ))}
            </div>

            <div
              key={mode}
              className="au-anim animate-[au-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
            >
              {mode === "signin" ? <SignIn /> : <SignUp />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
