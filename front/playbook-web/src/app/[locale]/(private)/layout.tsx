"use client";

import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import Image from "next/image";
import React, { useState } from "react";
import { Link } from "../../../../i18n/navigation";
import { usePathname } from "next/navigation";
import { BurgerMenu } from "./components/burgerMenu";

export const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const locale = useLocale();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const menu = [
    {
      name: "my-posts",
      route: ROUTES.POSTS,
    },
    {
      name: "my-matches",
      route: ROUTES.MATCHES,
    },
    {
      name: "my-profile",
      route: ROUTES.PROFILE,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12 lg:px-20">
          <Link href={ROUTES.HOME} className="relative h-8 w-32">
            <Image
              loading="eager"
              alt="app-logo"
              src="/logos/app-logo.png"
              fill
              className="object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {menu.map((el) => {
              const isActive = pathname.includes(el.route);
              return (
                <Link
                  key={el.name}
                  href={el.route}
                  className={`group relative py-1 transition-colors ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PlayText.Primary
                    id={el.name}
                    className="text-sm lg:text-base font-medium"
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-white shadow-sm shadow-white/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`lg:hidden rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer ${
              locale === "ar" ? "left-6" : "right-6"
            }`}
            aria-label="Toggle menu"
          >
            <Image
              loading="eager"
              alt="menu-icon"
              src="/icons/menu.png"
              width={20}
              height={20}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </button>

          <BurgerMenu
            close={() => setIsExpanded(false)}
            menu={menu}
            isOpen={isExpanded}
            locale={locale}
          />
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 lg:px-20">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-6 text-center text-sm text-slate-400">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          <p>
            &copy; {new Date().getFullYear()} playbook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivateLayout;
