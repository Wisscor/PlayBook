"use client";

import { useResize } from "@/hooks/contexts/resizeContext";
import Image from "next/image";
import React, { useState } from "react";
import { LanguageSwitcher } from "./languageSwitcher";
import { languages } from "@/lib/constants";
import { useLocale } from "next-intl";

export const Header: React.FC<{}> = ({}) => {
  const { windowWidth } = useResize();
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();

  return (
    <div className={"flex relative flex-row justify-between items-center "}>
      <Image
        loading="eager"
        alt="app-logo"
        src={
          windowWidth < 1024
            ? "/logos/app-logo.png"
            : "/logos/app-logo-dark.png"
        }
        width={128}
        height={36}
      />

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className={`bg-white/20 lg:bg-primary/20 rounded-t-xl ${!isOpen && "rounded-b-xl"} transition-all ease-in-out duration-150 py-2 px-3 cursor-pointer relative`}
      >
        <div className="flex flex-row gap-3 items-center">
          <Image
            loading="eager"
            alt="flag"
            src={languages.find((lang) => lang.value === locale)?.flag || ""}
            width={32}
            height={20}
            className="rounded-lg"
          />

          <Image
            loading="eager"
            alt="arrow-down"
            src={"/icons/arrow-down.png"}
            width={12}
            height={12}
          />
        </div>
      </button>
      <LanguageSwitcher
        isOpen={isOpen}
        changeLanguage={(lang) => {
          setIsOpen(!isOpen);
        }}
      />
    </div>
  );
};
