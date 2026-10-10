import { PlayText } from "@/components/ui/Text";
import React from "react";
import { Link } from "../../../../../i18n/navigation";

export const BurgerMenu: React.FC<{
  isOpen: boolean;
  menu: {
    name: string;
    route: string;
  }[];
  locale: string;
}> = ({ isOpen, menu, locale }) => {
  return (
    <div
      className={` ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      } bg-white100 px-6 absolute top-full w-fit ${locale === "ar" ? "left-0" : "right-0"} transition-all duration-300 ease-in-out shadow-lg rounded-md overflow-hidden`}
    >
      {menu.map((el) => {
        return (
          <Link key={el.name} href={el.route} className="  w-full py-2 block">
            <PlayText.Primary id={el.name} className="text-black text-sm" />
          </Link>
        );
      })}
    </div>
  );
};
