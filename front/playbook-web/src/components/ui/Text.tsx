import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

export const Primary: React.FC<{
  id: string;
  className?: string;
}> = ({ id, className }) => {
  const t = useTranslations();
  return <p className={twMerge(clsx("text-white", className))}>{t(id)}</p>;
};

export const PlayText = {
  Primary,
};
