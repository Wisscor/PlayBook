"use client";

import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

const useCountUp = (target: number, duration = 1000) => {
  const [value, setValue] = React.useState(0);
  const currentRef = React.useRef(0);

  React.useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const from = currentRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (target - from) * eased);
      currentRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
};

const StatTile: React.FC<{
  icon: string;
  value: number;
  label: string;
  delay: number;
}> = ({ icon, value, label, delay }) => {
  const count = useCountUp(value);

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="cm-anim group flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-neutral-950/40 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 transition-all duration-300 animate-[cm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/15"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
        <Image alt="" aria-hidden src={icon} width={24} height={24} />
      </div>
      <div className="min-w-0">
        <p className="bg-linear-to-r from-amber-100 to-primary bg-clip-text text-3xl font-extrabold leading-none tabular-nums text-transparent">
          {count}
        </p>
        <PlayText.Primary
          content={label}
          className="mt-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-stone-400"
        />
      </div>
    </div>
  );
};

const ProfileChip: React.FC<{ user?: User }> = ({ user }) => {
  const { goProfile } = useNavigation();

  if (!user) {
    return (
      <div className="h-14 w-56 animate-pulse rounded-full bg-secondary/40" />
    );
  }

  return (
    <button
      type="button"
      onClick={() => goProfile()}
      aria-label="View your profile"
      className="group flex w-fit max-w-full cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-neutral-950/40 py-1.5 pe-5 ps-1.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
    >
      <div className="shrink-0 rounded-full bg-linear-to-tr from-primary via-amber-200/60 to-extra p-0.5">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-extrabold text-white">
          {user.avatar ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:8443"}/${user.avatar}`}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <>
              {user.firstname.charAt(0).toUpperCase()}
              {user.lastname.charAt(0).toUpperCase()}
            </>
          )}
        </div>
      </div>
      <div className="min-w-0 text-start">
        <PlayText.Primary
          content={`${user.firstname} ${user.lastname}`}
          className="truncate text-sm font-bold text-stone-100"
        />
        <PlayText.Primary
          content={`@${user.username}`}
          className="truncate text-xs text-amber-200/70"
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
        className="h-4 w-4 shrink-0 text-stone-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-1"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};

export const CommunityHero: React.FC<{
  user?: User;
  totalMatches: number;
  totalPosts: number;
}> = ({ user, totalMatches, totalPosts }) => {
  const t = useTranslations();

  return (
    <section className="relative isolate overflow-hidden rounded-4xl border border-primary/25 bg-secondary/20 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10 lg:p-12">
      <div
        aria-hidden
        className="cm-anim pointer-events-none absolute -inset-s-24 -top-28 -z-10 h-80 w-80 rounded-full bg-primary/40 blur-3xl animate-[cm-float_14s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="cm-anim pointer-events-none absolute -bottom-32 -inset-e-16 -z-10 h-80 w-80 rounded-full bg-extra/40 blur-3xl animate-[cm-float_18s_ease-in-out_infinite_reverse]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <div className="cm-anim flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-xl shadow-primary/30 animate-[cm-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]">
            <Image
              alt=""
              aria-hidden
              src="/icons/globe.png"
              width={28}
              height={28}
            />
          </div>

          <PlayText.Primary
            id="community-title"
            className="cm-anim bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-size-[200%_100%] bg-clip-text text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-transparent animate-[cm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_backwards,cm-sheen_7s_linear_infinite] sm:text-5xl lg:text-6xl"
          />

          <PlayText.Primary
            id="community-subtitle"
            className="cm-anim max-w-xl text-pretty text-sm leading-relaxed text-stone-300/80 animate-[cm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_backwards] sm:text-base"
          />

          <div className="cm-anim max-w-full animate-[cm-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.24s_backwards]">
            <ProfileChip user={user} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatTile
            icon="/icons/friendship.png"
            value={totalMatches}
            label={t("matches")}
            delay={300}
          />
          <StatTile
            icon="/icons/addition.png"
            value={totalPosts}
            label={t("posts")}
            delay={400}
          />
        </div>
      </div>
    </section>
  );
};
