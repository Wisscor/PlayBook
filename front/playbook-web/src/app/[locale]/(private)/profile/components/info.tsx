import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

export const Info: React.FC<{
  label: string;
  value?: string;
  onClick: () => void;
  isEditing: boolean;
  updateValue: (value: string) => void;
  placeholder: string;
}> = ({ label, value, onClick, isEditing, updateValue, placeholder }) => {
  const t = useTranslations();

  return (
    <div className="flex items-center w-full gap-2">
      <PlayText.Primary id={label} className="text-gray text-[12px] flex-1  " />
      {isEditing ? (
        <PlayInput.Primary
          onChange={(e) => {
            updateValue(e.target.value);
          }}
          placeholder={placeholder}
          value={value ?? ""}
          className=" py-1 bg-gray text-sm rounded-[10px] flex-2 "
        />
      ) : (
        <PlayText.Primary
          content={`${value || t("not-set")}`}
          className={`${value ? "text-gray" : "text-warning"} text-[12px]  flex-2   `}
        />
      )}
      <button
        onClick={() => {
          onClick();
        }}
      >
        <Image alt="edit" src={"/icons/edit.png"} width={14} height={14} />
      </button>
    </div>
  );
};
