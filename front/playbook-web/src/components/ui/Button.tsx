import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { PlayText } from "./Text";

interface ButtonProps {
  title: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  textClassName?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}
interface ButtonChildrenProps {
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: React.ReactNode;
}

const Primary: React.FC<ButtonProps> = ({
  title,
  type,
  className,
  textClassName,
  onClick,
  disabled,
}) => {
  return (
    <button
      disabled={disabled}
      className={twMerge(
        clsx(
          ` ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} group relative flex items-center justify-center overflow-hidden rounded-2xl bg-linear-to-r from-primary to-extra px-6 py-3.5 text-sm lg:text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:shadow-lg`,
          className,
        ),
      )}
      type={type ?? "button"}
      onClick={onClick}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full group-disabled:hidden"
      />
      <PlayText.Primary
        id={title}
        className={twMerge(
          clsx("relative text-white font-semibold", textClassName),
        )}
      />
    </button>
  );
};

const Secondary: React.FC<ButtonProps> = ({
  title,
  type,
  className,
  textClassName,
  onClick,
  disabled,
}) => {
  return (
    <button
      disabled={disabled}
      className={twMerge(
        clsx(
          `${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} group relative flex items-center justify-center rounded-2xl border border-primary/40 bg-secondary/30 px-6 py-3.5 text-sm lg:text-base font-semibold text-white backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:translate-y-0 active:scale-[0.98] disabled:hover:translate-y-0 disabled:hover:shadow-none`,
          className,
        ),
      )}
      type={type ?? "button"}
      onClick={onClick}
    >
      <PlayText.Primary
        id={title}
        className={twMerge(clsx("text-white font-semibold", textClassName))}
      />
    </button>
  );
};

const Complexe: React.FC<ButtonChildrenProps> = ({
  disabled,
  className,
  type,
  onClick,
  children,
}) => {
  return (
    <button
      disabled={disabled}
      className={twMerge(
        clsx(
          `${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} group relative flex items-center justify-center rounded-2xl border border-primary/40 bg-secondary/30 px-6 py-3.5 text-sm lg:text-base font-semibold text-white backdrop-blur-md transition-all duration-300 ease-out hover:border-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]`,
          className,
        ),
      )}
      type={type ?? "button"}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const PlayButton = {
  Primary,
  Secondary,
  Complexe,
};
