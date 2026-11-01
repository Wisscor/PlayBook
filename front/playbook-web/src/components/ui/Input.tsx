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
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onInputClick?: React.MouseEventHandler<HTMLInputElement>;
  max?: number;
  name?: string;
  autoComplete?: string;
  ariaLabel?: string;
}

interface AreaProps {
  placeholder?: string;
  value: string;
  className?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
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
  onBlur,
  onInputClick,
  max,
  name,
  autoComplete,
  ariaLabel,
}) => {
  const t = useTranslations();

  return (
    <input
      name={name}
      autoComplete={autoComplete}
      aria-label={ariaLabel ?? (placeholder ? t(placeholder) : undefined)}
      maxLength={max ?? 30}
      onClick={onInputClick}
      onBlur={onBlur}
      value={value}
      onChange={onChange}
      type={type ?? "text"}
      placeholder={placeholder ? t(placeholder) : undefined}
      className={twMerge(
        clsx(
          "w-full rounded-2xl border border-white/10 bg-secondary/30 px-5 py-3.5 text-base text-stone-100 placeholder:text-stone-400 placeholder:text-sm backdrop-blur-md transition-all duration-300 outline-none hover:border-primary/40 focus:border-primary focus:bg-secondary/40 focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/30",
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
  disabled,
}) => {
  const t = useTranslations();

  return (
    <textarea
      disabled={disabled}
      maxLength={500}
      value={value}
      onChange={onChange}
      placeholder={placeholder ? t(placeholder) : undefined}
      className={twMerge(
        clsx(
          "w-full rounded-2xl border border-white/10 bg-secondary/30 px-5 py-3.5 text-base text-stone-100 placeholder:text-stone-400 placeholder:text-sm backdrop-blur-md transition-all duration-300 outline-none hover:border-primary/40 focus:border-primary focus:bg-secondary/40 focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-30",
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
  onInputClick,
  onBlur,
  max,
  ariaLabel,
  autoComplete,
  name,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="relative w-full">
      <input
        name={name}
        autoComplete={autoComplete}
        aria-label={ariaLabel ?? (placeholder ? t(placeholder) : undefined)}
        maxLength={max}
        onClick={onInputClick}
        onBlur={onBlur}
        value={value}
        onChange={onChange}
        type={isHidden ? "password" : "text"}
        placeholder={placeholder ? t(placeholder) : undefined}
        className={twMerge(
          clsx(
            "w-full rounded-2xl border border-white/10 bg-secondary/30 px-5 py-3.5 text-base text-stone-100 placeholder:text-stone-400 placeholder:text-sm backdrop-blur-md transition-all duration-300 outline-none hover:border-primary/40 focus:border-primary focus:bg-secondary/40 focus:shadow-lg focus:shadow-primary/10 focus:ring-2 focus:ring-primary/30 pe-12",
            className,
          ),
        )}
      />
      <button
        type="button"
        onClick={onClick}
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-stone-400 transition-all duration-300 hover:scale-110 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90 ${
          locale === "ar" ? "left-3" : "right-3"
        }`}
      >
        <Image
          loading="eager"
          alt="toggle visibility"
          src={!isHidden ? "/icons/view.png" : "/icons/hide.png"}
          width={20}
          height={20}
          className="opacity-70 transition-opacity hover:opacity-100"
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
