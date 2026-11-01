import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Link } from "../../../i18n/navigation";

interface SpanText {
  text?: string;
  content?: string;
  className?: string;
  path?: string;
  values?: Record<string, string | number | Date>;
}

interface PrimaryTextProps {
  id?: string;
  className?: string;
  content?: string;
  values?: Record<string, string | number | Date>;
}

interface SpanTextProps {
  texts: SpanText[];
  className?: string;
}

const Primary: React.FC<PrimaryTextProps> = ({
  id,
  className,
  content,
  values,
}) => {
  const t = useTranslations();
  return (
    <p className={twMerge(clsx("text-white font-medium", className))}>
      {id ? t(id, values) : content}
    </p>
  );
};

const Span: React.FC<SpanTextProps> = ({ texts, className }) => {
  const t = useTranslations();

  return (
    <p
      className={twMerge(
        clsx("flex flex-wrap items-center gap-1.5", className),
      )}
    >
      {texts.map((item, index) => {
        const values = item.values || {};
        const textContent = item.text ? t(item.text, values) : item.content;
        const key = item.text || item.content || index;

        if (item.path) {
          return (
            <Link key={key} href={item.path}>
              <span
                className={twMerge(
                  clsx(
                    "text-white font-semibold underline underline-offset-4 transition-colors hover:text-slate-200",
                    item.className,
                  ),
                )}
              >
                {textContent}
              </span>
            </Link>
          );
        }

        return (
          <span
            key={key}
            className={twMerge(clsx("text-white font-medium", item.className))}
          >
            {textContent}
          </span>
        );
      })}
    </p>
  );
};

export const PlayText = {
  Primary,
  Span,
};
