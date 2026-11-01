"use client";

import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import Image from "next/image";
import React from "react";
import { Link } from "../../../../../../i18n/navigation";

const actions = [
  { id: "view-profile", href: ROUTES.PROFILE, icon: "/icons/avatar.png" },
  { id: "my-matches", href: ROUTES.MATCHES, icon: "/icons/friendship.png" },
  { id: "my-posts", href: ROUTES.POSTS, icon: "/icons/addition.png" },
];

export const QuickActions: React.FC = () => {
  return (
    <nav
      aria-label="Quick actions"
      className="hidden grid-cols-3 gap-4 sm:grid"
    >
      {actions.map((action, index) => (
        <Link
          key={action.id}
          href={action.href}
          style={{ animationDelay: `${index * 90}ms` }}
          className="cm-anim group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-secondary/20 p-4 backdrop-blur-xl transition-all duration-300 animate-[cm-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards] hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 hover:shadow-xl hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-extra/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
            <Image
              alt=""
              aria-hidden
              src={action.icon}
              width={22}
              height={22}
            />
          </span>
          <PlayText.Primary
            id={action.id}
            className="relative min-w-0 flex-1 truncate text-sm font-semibold text-stone-100"
          />
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative h-4 w-4 shrink-0 -translate-x-1 text-amber-200 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      ))}
    </nav>
  );
};
