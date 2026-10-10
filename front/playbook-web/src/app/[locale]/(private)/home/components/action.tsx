import { PlayText } from "@/components/ui/Text";
import Image from "next/image";
import React, { FC } from "react";

export const Action: FC<{
  action: {
    action: string;
    description: string;
    icon: string;
    onClick: () => void;
  };
}> = ({ action }) => {
  return (
    <button
      onClick={() => {
        action.onClick();
      }}
      className="flex flex-col  items-center p-8 gap-4 rounded-md bg-primary/10 hover:bg-primary/20 transition-all duration-300 cursor-pointer hover:scale-105"
    >
      <div className="p-4 rounded-md bg-primary">
        <Image alt={action.action} src={action.icon} width={32} height={32} />
      </div>
      <PlayText.Primary id={action.action} className="text-black text-xl" />
      <PlayText.Primary id={action.description} className="text-black" />
    </button>
  );
};
