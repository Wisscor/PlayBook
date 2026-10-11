import clsx from "clsx";
import { useTranslations } from "next-intl";
import React from "react";
import { twMerge } from "tailwind-merge";
import { Link } from "../../../i18n/navigation";

interface SpanText {
  text: string;
  className?: string;
  path?: string;
}

const Primary: React.FC<{
  id?: string;
  className?: string;
  content?: string;
}> = ({ id, className, content }) => {
  const t = useTranslations();
  return (
    <p className={twMerge(clsx("text-white", className))}>
      {id ? t(id) : content}
    </p>
  );
};

const Span: React.FC<{
  texts: SpanText[];
  className?: string;
}> = ({ texts, className }) => {
  const t = useTranslations();

  return (
    <p className={twMerge(clsx("flex flex-wrap ", className))}>
      {texts.map((text, _index) => {
        if (text.path) {
          return (
            <Link key={text.text} href={text.path}>
              <span
                key={text.text}
                className={twMerge(clsx("text-white", text.className))}
              >
                {t(text.text)}
              </span>
            </Link>
          );
        }

        return (
          <span
            key={text.text}
            className={twMerge(clsx("text-white", text.className))}
          >
            {t(text.text)}
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
