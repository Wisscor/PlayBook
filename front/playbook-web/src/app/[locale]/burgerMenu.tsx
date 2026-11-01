import { PlayText } from "@/components/ui/Text";
import { useAuthController } from "@/services/auth";
import React from "react";

export const BurgerMenu: React.FC<{
  isOpen: boolean;
  locale: string;
  close: () => void;
  more: React.JSX.Element;
}> = ({ isOpen, locale, close, more }) => {
  const { signOut } = useAuthController();

  return (
    <div
      className={`absolute z-30 min-w-56 space-y-4 rounded-2xl border border-primary/25 bg-neutral-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl top-full mt-3 transform transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        locale === "ar" ? "left-0 origin-top-left" : "right-0 origin-top-right"
      } ${
        isOpen
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-2 scale-95 opacity-0"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent"
      />

      <div className="px-1 pt-1">{more}</div>

      <div className="border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => {
            void signOut(() => {
              close();
              window.location.reload();
            });
          }}
          className="flex w-full cursor-pointer rounded-xl px-4 py-2.5 text-start text-amber-200 transition-all duration-300 hover:bg-extra/30 active:scale-[0.98]"
        >
          <PlayText.Primary
            id="logout"
            className="text-sm font-medium text-amber-200"
          />
        </button>
      </div>
    </div>
  );
};
