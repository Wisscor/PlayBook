import { PlayText } from "@/components/ui/Text";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";

export const Primary: React.FC<{
  close: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  title: string;
}> = ({ close, isOpen, children, title }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-300 ease-in-out ${
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div
        className={`px-6 py-4 flex flex-col gap-4 rounded-md lg:w-1/2 w-full m-4 bg-white `}
      >
        <div className="flex gap-4 items-center justify-between">
          <div />
          <PlayText.Primary id={title} className="text-black text-xl" />
          <button
            onClick={() => {
              close();
            }}
            className="cursor-pointer"
          >
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export const PlayModal = {
  Primary,
};
