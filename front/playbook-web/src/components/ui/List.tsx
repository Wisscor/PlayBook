import React from "react";
import { PlayText } from "./Text";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const Primary: React.FC<{
  toggle: () => void;
  isOpen: boolean;
  text: string;
  items: any[];
  choseItem: (item: any) => void;
  value?: string;
}> = ({ toggle, isOpen, text, items, choseItem, value }) => {
  return (
    <div>
      <button
        onClick={() => {
          toggle();
        }}
        className={`bg-primary/20 cursor-pointer  py-2 px-4 w-full ${isOpen ? "rounded-t-xl " : "rounded-xl"} flex items-center justify-between`}
      >
        <PlayText.Primary content={text} className="text-black text-sm" />

        <ExpandMoreIcon width={24} height={24} />
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100 mt-0"
            : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`bg-primary/20 flex flex-col px-4 py-2 transition-all duration-300 ease-in-out ${isOpen ? "translate-y-0 rounded-b-xl" : "-translate-y-2 rounded-xl"}`}
          >
            {items.map((item) => {
              return (
                <button
                  key={value ? item[value] : item}
                  onClick={() => {
                    choseItem(item);
                  }}
                  className="cursor-pointer"
                >
                  <PlayText.Primary
                    content={value ? item[value] : item}
                    className=" text-black text-start"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayList = {
  Primary,
};
