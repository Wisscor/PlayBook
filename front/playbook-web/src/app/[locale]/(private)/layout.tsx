"use client";

import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import Image from "next/image";
import React from "react";
import { Link } from "../../../../i18n/navigation";
import { BurgerMenu } from "./components/burgerMenu";

export const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = React.useState(false);
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
    <div className="flex flex-col min-h-screen">
      <header className="bg-linear-to-b from-extra to-secondary  text-white p-4 lg:px-30 shadow-2xl">
        <div className="flex items-center  justify-between relative">
          <Image
            loading="eager"
            alt="app-logo"
            src={"/logos/app-logo.png"}
            width={128}
            height={36}
          />
          <div className="hidden lg:flex items-center gap-4">
            {menu.map((el) => {
              return (
                <Link key={el.name} href={el.route}>
                  <PlayText.Primary
                    id={el.name}
                    className="text-white text-lg font-medium "
                  />
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
            className={`lg:hidden absolute ${locale === "ar" ? "left-0" : "right-0"} top-1/2 transform -translate-y-1/2`}
          >
            <Image
              loading="eager"
              alt="menu-icon"
              src={"/icons/menu.png"}
              width={24}
              height={24}
              className="static"
            />
          </button>
          <BurgerMenu
            close={() => {
              setIsExpanded(!isExpanded);
            }}
            menu={menu}
            isOpen={isExpanded}
            locale={locale}
          />
        </div>
      </header>
      <main className="grow">{children}</main>
      <footer className="bg-linear-to-b from-extra to-secondary text-center text-sm  text-white p-4 lg:px-30 shadow-2xl">
        <p>&copy; {new Date().getFullYear()} playbook. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivateLayout;
