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
      className={`absolute z-20 min-w-40 p-2 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl top-full mt-2 transition-all duration-200 ease-out transform ${
        locale === "ar" ? "left-0" : "right-0"
      } ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
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
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                isSelected
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Image
                alt={lang.name}
                src={lang.flag}
                width={22}
                height={15}
                className="rounded object-cover shadow-sm"
              />
              <PlayText.Primary
                id={lang.name}
                className="text-sm font-medium"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
