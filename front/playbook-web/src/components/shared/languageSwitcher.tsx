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

  const changeRouteLanguage = (old: string, locale: string) => {
    const newPathname = pathname.replace(`${old}`, `${locale}`);
    router.replace(newPathname);
  };

  return (
    <div
      className={` z-10 px-4 py-3 rounded-b-xl   absolute ${locale == "ar" ? "left-0 rounded-tr-xl" : "right-0 rounded-tl-xl"}  bg-white lg:bg-black top-full transition-all ease-in-out duration-150 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div className="flex flex-col justify-center  gap-3  ">
        {languages.map((lang) => {
          return (
            <button
              onClick={() => {
                changeRouteLanguage(locale, lang.value);
                changeLanguage(lang);
              }}
              type="button"
              key={lang.id}
              className="flex  cursor-pointer flex-row items-center gap-4 "
            >
              <Image alt="lang" src={lang.flag} width={32} height={20} />
              <PlayText.Primary
                id={lang.name}
                className="text-black lg:text-white"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
