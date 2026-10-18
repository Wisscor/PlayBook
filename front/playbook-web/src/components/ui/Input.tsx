import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import { twMerge } from "tailwind-merge";

interface InputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}

interface AreaProps {
  placeholder?: string;
  value: string;
  className?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

interface PasswordProps extends InputProps {
  isHidden: boolean;
  onClick: () => void;
}

const Primary: React.FC<InputProps> = ({
  placeholder,
  value,
  onChange,
  type,
  className,
}) => {
  const t = useTranslations();

  return (
    <input
      value={value}
      onChange={onChange}
      type={type ?? "text"}
      placeholder={placeholder ? t(placeholder) : undefined}
      className={twMerge(
        clsx(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-slate-400 placeholder:text-sm backdrop-blur-md transition-all outline-none focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20",
          className,
        ),
      )}
    />
  );
};

const Area: React.FC<AreaProps> = ({
  placeholder,
  value,
  className,
  onChange,
}) => {
  const t = useTranslations();

  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder ? t(placeholder) : undefined}
      className={twMerge(
        clsx(
          "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-slate-400 placeholder:text-sm backdrop-blur-md transition-all outline-none focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20 resize-y min-h-30",
          className,
        ),
      )}
    />
  );
};

const Password: React.FC<PasswordProps> = ({
  placeholder,
  value,
  onChange,
  type,
  isHidden,
  onClick,
  className,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="relative w-full">
      <input
        value={value}
        onChange={onChange}
        type={isHidden ? "password" : "text"}
        placeholder={placeholder ? t(placeholder) : undefined}
        className={twMerge(
          clsx(
            "w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-slate-400 placeholder:text-sm backdrop-blur-md transition-all outline-none focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/20 pr-12",
            className,
          ),
        )}
      />
      <button
        type="button"
        onClick={onClick}
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-white transition-colors ${
          locale === "ar" ? "left-4" : "right-4"
        }`}
      >
        <Image
          loading="eager"
          alt="toggle visibility"
          src={!isHidden ? "/icons/view.png" : "/icons/hide.png"}
          width={20}
          height={20}
          className="opacity-70 hover:opacity-100 transition-opacity"
        />
      </button>
    </div>
  );
};

export const PlayInput = {
  Primary,
  Password,
  Area,
};
