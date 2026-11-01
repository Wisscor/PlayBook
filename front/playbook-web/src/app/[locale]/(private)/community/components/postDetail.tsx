import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import React from "react";

export const PostDetail: React.FC<{
  close: () => void;
  isOpen: boolean;
  postText?: string;
}> = ({ close, isOpen, postText }) => {
  if (!postText) return null;
  return (
    <PlayModal.Primary isOpen={isOpen} close={close} title="post">
      <div className="flex flex-col gap-6 pt-1">
        <div className="relative max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950/40 p-5 pe-6 [scrollbar-color:var(--color-primary)_transparent] scrollbar-thin">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-e-4 top-1 select-none font-serif text-7xl leading-none text-primary/25"
          >
            &rdquo;
          </span>
          <PlayText.Primary
            content={postText}
            className="relative whitespace-pre-wrap text-base font-normal leading-relaxed text-stone-100 wrap-break-word"
          />
        </div>
      </div>
    </PlayModal.Primary>
  );
};
