import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import { twMerge } from "tailwind-merge";
import { PlayText } from "./Text";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  id?: string;
  content?: string;
  className?: string;
  children?: React.ReactNode;
}

const Primary: React.FC<LabelProps> = ({
  id,
  content,
  className,
  children,
}) => {
  const t = useTranslations();
  const textContent = id ? t(id) : content;

  return (
    <label
      className={twMerge(
        clsx(
          "flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300",
          className,
        ),
      )}
    >
      {textContent && <PlayText.Span texts={[{ content: textContent }]} />}
      {children}
    </label>
  );
};

export const PlayLabel = {
  Primary,
};
