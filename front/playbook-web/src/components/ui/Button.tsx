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
          ` ${disabled ? "cursor-not-allowed" : "cursor-pointer"} group relative flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm lg:text-base font-semibold text-slate-950 shadow-xl shadow-white/5 transition-all duration-200 ease-out hover:bg-slate-100 hover:shadow-white/10 active:scale-[0.98]`,
          className,
        ),
      )}
      type={type ?? "button"}
      onClick={onClick}
    >
      <PlayText.Primary
        id={title}
        className={twMerge(clsx("text-slate-950 font-semibold", textClassName))}
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
          `${disabled ? "cursor-not-allowed" : "cursor-pointer"} group relative flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm lg:text-base font-semibold text-white backdrop-blur-md transition-all duration-200 ease-out hover:border-white/40 hover:bg-white/10 active:scale-[0.98]`,
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
          `${disabled ? "cursor-not-allowed" : "cursor-pointer"} group relative flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm lg:text-base font-semibold text-white backdrop-blur-md transition-all duration-200 ease-out hover:border-white/40 hover:bg-white/10 active:scale-[0.98]`,
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
