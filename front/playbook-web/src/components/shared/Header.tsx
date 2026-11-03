"use client";

import Image from "next/image";
import React, { useState } from "react";
import { LanguageSwitcher } from "./languageSwitcher";
import { languages, ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import { Link } from "../../../i18n/navigation";
import { PlayText } from "../ui/Text";
import { useDismiss } from "@/hooks/useDismiss";

const navLinkClass =
  "group relative py-1 text-sm font-medium text-white/80 transition-colors duration-200 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded";

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const langRef = useDismiss(isOpen, () => setIsOpen(false));

  const currentLang = languages.find((lang) => lang.value === locale);

  useDismiss(isMobileMenuOpen, () => setIsMobileMenuOpen(false), {
    outsideClick: false,
  });

  return (
    <header className="relative flex flex-row items-center justify-between gap-2 rounded-2xl border border-white/10 bg-secondary/30 px-3 py-2 shadow-lg shadow-black/20 sm:gap-4 sm:px-5">
      <Link
        href={ROUTES.ROOT}
        aria-label="PlayBook"
        className="relative block h-8 w-28 shrink-0 transition-transform duration-300 hover:scale-105 sm:h-9 sm:w-32"
      >
        <Image
          alt="PlayBook"
          src="/logos/app-logo.png"
          fill
          sizes="128px"
          loading="eager"
          className="object-contain"
        />
      </Link>

      <nav className="hidden items-center gap-6 sm:flex">
        <Link href={ROUTES.PRIVACY_POLICY} className={navLinkClass}>
          <PlayText.Primary
            id="privacy-policy"
            className="text-sm font-medium"
          />
          <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-primary to-transparent transition-transform duration-300 group-hover:scale-x-100" />
        </Link>
        <Link href={ROUTES.TERMS_OF_SERVICE} className={navLinkClass}>
          <PlayText.Primary
            id="terms-of-service"
            className="text-sm font-medium"
          />
          <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-primary to-transparent transition-transform duration-300 group-hover:scale-x-100" />
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <div ref={langRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Change language"
            aria-haspopup="true"
            aria-expanded={isOpen}
            className={`flex cursor-pointer items-center gap-2 border border-white/10 bg-white/10 px-2.5 py-1.5 transition-all duration-200 hover:border-primary/50 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:gap-3 sm:px-3.5 sm:py-2 ${
              isOpen ? "rounded-t-xl" : "rounded-xl"
            }`}
          >
            {currentLang?.flag && (
              <Image
                style={{ width: 24, height: 16 }}
                loading="eager"
                alt=""
                src={currentLang.flag}
                width={24}
                height={16}
                className="rounded-md object-cover shadow-sm"
              />
            )}

            <Image
              style={{ width: 10, height: 10 }}
              loading="eager"
              alt=""
              src="/icons/arrow-down.png"
              width={10}
              height={10}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <LanguageSwitcher
            isOpen={isOpen}
            changeLanguage={() => {
              setIsOpen(false);
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="cursor-pointer rounded-xl border border-white/10 bg-white/10 p-2 transition-all duration-200 hover:border-primary/50 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95 sm:hidden"
          aria-label="Toggle Legal Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Image
            style={{ width: 20, height: 20 }}
            loading="eager"
            alt=""
            src="/icons/menu.png"
            width={20}
            height={20}
            className="opacity-80 transition-opacity hover:opacity-100"
          />
        </button>
      </div>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute inset-e-0 top-14 z-50 flex w-60 flex-col gap-3 rounded-2xl border border-primary/25 bg-neutral-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <PlayText.Span
                texts={[{ text: "legal-pages" }]}
                className="text-xs font-semibold uppercase tracking-wider text-amber-200/80"
              />

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="cursor-pointer rounded-lg px-1.5 py-0.5 text-xs text-stone-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <Link
                href={ROUTES.PRIVACY_POLICY}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl p-2.5 text-sm font-medium text-stone-200 transition-colors hover:bg-primary/20 hover:text-amber-100"
              >
                <PlayText.Primary id="privacy-policy" />
              </Link>
              <Link
                href={ROUTES.TERMS_OF_SERVICE}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl p-2.5 text-sm font-medium text-stone-200 transition-colors hover:bg-primary/20 hover:text-amber-100"
              >
                <PlayText.Primary id="terms-of-service" />
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
