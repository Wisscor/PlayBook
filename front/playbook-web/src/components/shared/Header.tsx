"use client";

import Image from "next/image";
import React, { useState } from "react";
import { LanguageSwitcher } from "./languageSwitcher";
import { languages, ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import { Link } from "../../../i18n/navigation";

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();

  const currentLang = languages.find((lang) => lang.value === locale);

  return (
    <header className="relative flex flex-row items-center justify-between">
      <Link href={ROUTES.ROOT} className="relative h-9 w-32">
        <Image
          loading="eager"
          alt="app-logo-dark"
          src="/logos/app-logo.png"
          fill
          className="object-contain  block"
        />
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 bg-white/10 hover:bg-white/20 lg:bg-primary/20 lg:hover:bg-primary/30 px-3.5 py-2 transition-all duration-200 cursor-pointer border border-white/10 backdrop-blur-md ${
            isOpen ? "rounded-t-xl" : "rounded-xl"
          }`}
        >
          {currentLang?.flag && (
            <Image
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
    </header>
  );
};
