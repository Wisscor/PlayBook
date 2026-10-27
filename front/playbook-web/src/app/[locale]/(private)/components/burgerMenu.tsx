import { PlayText } from "@/components/ui/Text";
import { useAuthController } from "@/services/auth";
import { usePathname } from "next/navigation";
import React from "react";
import { Link } from "../../../../../i18n/navigation";

export const BurgerMenu: React.FC<{
  isOpen: boolean;
  menu: {
    name: string;
    route: string;
  }[];
  locale: string;
  close: () => void;
  more: React.JSX.Element;
}> = ({ isOpen, menu, locale, close, more }) => {
  const { signOut } = useAuthController();
  const pathname = usePathname();

  return (
    <div
      className={`absolute z-30 min-w-50 space-y-5 p-2 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl top-full mt-3 transition-all duration-200 ease-out transform ${
        locale === "ar" ? "left-0" : "right-0"
      } ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="flex flex-col gap-1">
        {menu.map((el) => {
          const isActive = pathname.includes(el.route);
          return (
            <Link
              key={el.name}
              href={el.route}
              onClick={() => close()}
              className={`flex w-full cursor-pointer items-center rounded-xl px-4 py-2.5 transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-semibold"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <PlayText.Primary
                id={el.name}
                className={`text-sm ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-slate-300 font-medium"
                }`}
              />
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            void signOut(() => {
              close();
            });
          }}
          className="flex w-full cursor-pointer rounded-xl px-4 py-2.5 text-left text-rose-300 transition-colors hover:bg-rose-500/10"
        >
          <PlayText.Primary
            id="logout"
            className="text-sm font-medium text-rose-300"
          />
        </button>
      </div>
      {more}
    </div>
  );
};
