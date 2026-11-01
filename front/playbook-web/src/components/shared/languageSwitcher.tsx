import { languages } from "@/lib/constants";
import Image from "next/image";
import React from "react";
import { PlayText } from "../ui/Text";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export const LanguageSwitcher: React.FC<{
  isOpen: boolean;
  changeLanguage: (lang: (typeof languages)[0]) => void;
}> = ({ isOpen, changeLanguage }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeRouteLanguage = (old: string, newLocale: string) => {
    const newPathname = pathname.replace(`/${old}`, `/${newLocale}`);
    router.replace(newPathname);
  };

  return (
    <div
      aria-hidden={!isOpen}
      className={`absolute inset-e-0 top-full z-20 mt-2 min-w-44 origin-top transform rounded-2xl border border-primary/25 bg-neutral-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 ease-out ${
        isOpen
          ? "visible translate-y-0 scale-100 opacity-100"
          : "invisible -translate-y-2 scale-95 opacity-0"
      }`}
    >
      <div className="flex flex-col gap-1">
        {languages.map((lang) => {
          const isSelected = locale === lang.value;
          return (
            <button
              key={lang.id}
              onClick={() => {
                changeRouteLanguage(locale, lang.value);
                changeLanguage(lang);
              }}
              type="button"
              aria-current={isSelected ? "true" : undefined}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-start transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                isSelected
                  ? "bg-lineara-to-r from-primary/30 to-extra/20 font-semibold text-amber-100"
                  : "text-stone-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Image
                style={{ width: 24, height: 16 }}
                alt=""
                src={lang.flag}
                width={24}
                height={16}
                className="rounded object-cover shadow-sm"
                loading="eager"
              />
              <PlayText.Primary
                id={lang.name}
                className="flex-1 text-sm font-medium"
              />
              {isSelected && (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-amber-200"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
