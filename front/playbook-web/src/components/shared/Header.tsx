"use client";

import Image from "next/image";
import React, { useState } from "react";
import { LanguageSwitcher } from "./languageSwitcher";
import { languages, ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import { Link } from "../../../i18n/navigation";
import { PlayText } from "../ui/Text";

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locale = useLocale();

  const currentLang = languages.find((lang) => lang.value === locale);

  return (
    <header className="relative flex flex-row items-center justify-between gap-2 sm:gap-4">
      <Link
        href={ROUTES.ROOT}
        className="relative block h-8 w-28 shrink-0 sm:h-9 sm:w-32"
      >
        <Image
          alt="app-logo-dark"
          src="/logos/app-logo.png"
          fill
          loading="eager"
          sizes="(max-width: 640px) 112px, 128px"
          className="object-contain"
        />
      </Link>

      <nav className="hidden items-center gap-6 sm:flex">
        <Link
          href={ROUTES.PRIVACY_POLICY}
          className="transition-colors duration-200 hover:text-white"
        >
          <PlayText.Primary
            id="privacy-policy"
            className="text-sm font-medium text-white/80"
          />
        </Link>
        <Link
          href={ROUTES.TERMS_OF_SERVICE}
          className="transition-colors duration-200 hover:text-white"
        >
          <PlayText.Primary
            id="terms-of-service"
            className="text-sm font-medium text-white/80"
          />
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/20 lg:bg-primary/20 lg:hover:bg-primary/30 px-2.5 py-1.5 sm:px-3.5 sm:py-2 transition-all duration-200 cursor-pointer border border-white/10 backdrop-blur-md ${
              isOpen ? "rounded-t-xl" : "rounded-xl"
            }`}
          >
            {currentLang?.flag && (
              <Image
                style={{ width: 24, height: 16 }}
                loading="eager"
                alt="flag"
                src={currentLang.flag}
                width={24}
                height={16}
                className="rounded-md object-cover shadow-sm"
              />
            )}

            <Image
              loading="eager"
              alt="arrow-down"
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
          className="rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur-md hover:bg-white/20 sm:hidden cursor-pointer"
          aria-label="Toggle Legal Menu"
        >
          <Image
            loading="eager"
            alt="menu-icon"
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute top-12 right-0 z-50 flex w-56 flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl sm:hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <PlayText.Span
                texts={[{ text: "legal-pages" }]}
                className="text-xs font-semibold text-slate-400"
              />

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              <Link
                href={ROUTES.PRIVACY_POLICY}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl p-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
              >
                <PlayText.Primary id="privacy-policy" />
              </Link>
              <Link
                href={ROUTES.TERMS_OF_SERVICE}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl p-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
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
