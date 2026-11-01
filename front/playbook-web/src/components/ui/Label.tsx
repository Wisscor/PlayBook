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
          "group flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200/70",
          className,
        ),
      )}
    >
      {textContent && (
        <PlayText.Span
          texts={[
            {
              content: textContent,
              className:
                "font-semibold text-amber-200/70 transition-colors duration-300 group-focus-within:text-amber-200",
            },
          ]}
        />
      )}
      {children}
    </label>
  );
};

export const PlayLabel = {
  Primary,
};
