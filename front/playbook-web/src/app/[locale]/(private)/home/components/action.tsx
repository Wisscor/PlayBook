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
      onClick={() => action.onClick()}
      className="group relative flex flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl cursor-pointer w-full"
    >
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-lg transition-transform duration-300 group-hover:scale-110">
        <Image
          alt={action.action}
          src={action.icon}
          width={32}
          height={32}
          className="object-contain filter drop-shadow"
        />
      </div>

      <div className="flex flex-col gap-2">
        <PlayText.Primary
          id={action.action}
          className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-slate-100"
        />
        <PlayText.Primary
          id={action.description}
          className="text-xs leading-relaxed text-slate-300"
        />
      </div>
    </button>
  );
};

export default Action;
