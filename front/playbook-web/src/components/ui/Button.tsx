import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { PlayText } from "./Text";

const Primary: React.FC<{
  title: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  textClassName?: string;
}> = ({ title, type, className, textClassName }) => {
  return (
    <button
      className={twMerge(
        clsx(
          "rounded-xl bg-white100 cursor-pointer text-black text-[12px] lg:text-lg py-3 w-full drop-shadow-lg shadow-black",
          className,
        ),
      )}
      type={type ?? "button"}
    >
      <PlayText.Primary id={title} className={`text-black ${textClassName}`} />
    </button>
  );
};

const Secondary: React.FC<{
  title: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  textClassName?: string;
}> = ({ title, type, className, textClassName }) => {
  return (
    <button
      className={twMerge(
        clsx(
          "rounded-xl bg-transparent cursor-pointer border-2 border-white100 border-o text-white100 drop-shadow-lg shadow-black text-[12px] lg:text-lg py-3 w-full",
          className,
        ),
      )}
      type={type ?? "button"}
    >
      <PlayText.Primary id={title} className={`text-black ${textClassName}`} />
    </button>
  );
};

export const PlayerButton = {
  Primary,
  Secondary,
};
