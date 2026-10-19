import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import { twMerge } from "tailwind-merge";

const Primary: React.FC<{
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}> = ({ placeholder, value, onChange, type, className }) => {
  const t = useTranslations();

  return (
    <input
      value={value}
      onChange={onChange}
      type={type ?? "text"}
      placeholder={t(placeholder)}
      className={twMerge(
        clsx(
          "bg-white100/20 outline-0 backdrop-opacity-20 rounded-xl px-6 py-4 text-white text-lg w-full placeholder:text-black placeholder:text-sm ",
          className,
        ),
      )}
    />
  );
};

const Area: React.FC<{
  placeholder: string;
  value: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement, HTMLTextAreaElement>;
}> = ({ placeholder, value, type, className, onChange }) => {
  const t = useTranslations();

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={t(placeholder)}
      className={twMerge(
        clsx(
          "w-full rounded-xl bg-white100/10 backdrop-blur-md border border-white100/20 px-6 py-4 text-lg text-white placeholder:text-black/50 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-white/40 resize-y min-h-30",
          className,
        ),
      )}
    />
  );
};

const Password: React.FC<{
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
  isHidden: boolean;
  onClick: () => void;
  className?: string;
}> = ({ placeholder, value, onChange, type, isHidden, onClick, className }) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        type={isHidden ? "password" : "text"}
        placeholder={t(placeholder)}
        className={twMerge(
          clsx(
            "bg-white100/20 outline-0 backdrop-opacity-20 rounded-xl px-6 py-4 text-white text-lg w-full placeholder:text-black placeholder:text-sm ",
            className,
          ),
        )}
      />
      <Image
        onClick={() => {
          onClick();
        }}
        loading="eager"
        alt="hide"
        src={!isHidden ? "/icons/view.png" : "/icons/hide.png"}
        width={20}
        height={20}
        className={twMerge(
          clsx(
            `absolute ${locale === "ar" ? "left-6" : "right-6"} top-1/2 -translate-y-1/2 cursor-pointer `,
            className,
          ),
        )}
      />
    </div>
  );
};

export const PlayInput = {
  Primary,
  Password,
  Area,
};
