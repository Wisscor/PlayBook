import { PlayInput } from "@/components/ui/Input";
import { PlayModal } from "@/components/ui/Modal";
import React from "react";

export const PostDetail: React.FC<{
  close: () => void;
  isOpen: boolean;
  postText?: string;
}> = ({ close, isOpen, postText }) => {
  if (!postText) return null;
  return (
    <PlayModal.Primary isOpen={isOpen} close={close} title="post">
      <div className="flex flex-col gap-6 pt-1 ">
        <PlayInput.Area
          value={postText}
          disabled={true}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all scrollbar-none"
        />
      </div>
    </PlayModal.Primary>
  );
};
