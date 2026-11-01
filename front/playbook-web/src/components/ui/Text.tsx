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
    <p className={twMerge(clsx("text-stone-100 font-medium", className))}>
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
            <Link
              key={key}
              href={item.path}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span
                className={twMerge(
                  clsx(
                    "text-amber-200 font-semibold underline decoration-primary decoration-2 underline-offset-4 transition-all duration-300 hover:text-amber-100 hover:decoration-amber-200",
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
            className={twMerge(
              clsx("text-stone-100 font-medium", item.className),
            )}
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
