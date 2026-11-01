"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { usePostController } from "@/services/post";
import React, { useState } from "react";

export const PostModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  const { addPost } = usePostController();
  const { isLoading } = useAuth();
  const [postText, setPostText] = useState<string>("");
  const [error, setError] = useState<undefined | string>(undefined);

  const handleCreatePost = () => {
    if (!postText.trim()) return;

    setError(undefined);

    void addPost(
      postText,
      () => {
        setPostText("");
        close();
      },
      (requestError) => {
        setError(requestError);
      },
    );
  };

  return (
    <PlayModal.Primary isOpen={isOpen} close={close} title="create-post">
      <style>{`
        @keyframes pm-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pm-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-6 pt-1">
        <div className="relative flex flex-col gap-2">
          <PlayLabel.Primary>
            <PlayInput.Area
              onChange={(e) => setPostText(e.target.value)}
              placeholder="your-post"
              value={postText}
              className="min-h-35 w-full resize-none p-4"
            />
          </PlayLabel.Primary>

          <div className="flex justify-end">
            <PlayText.Span
              texts={[
                {
                  text: `characters`,
                  values: { characters: postText.length },
                  className:
                    "text-xs tabular-nums text-stone-400 transition-colors duration-300",
                },
              ]}
            />
          </div>
        </div>

        {error && (
          <div className="pm-anim rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 animate-[pm-in_0.3s_ease-out_both]">
            <PlayText.Primary id={error} className="text-sm text-rose-300" />
          </div>
        )}

        {postText.trim().length > 0 && (
          <div className="pm-anim pt-2 animate-[pm-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both]">
            <PlayButton.Primary
              onClick={handleCreatePost}
              title={isLoading ? "creating-post" : "create-post"}
              className="w-full py-3.5"
            />
          </div>
        )}
      </div>
    </PlayModal.Primary>
  );
};
