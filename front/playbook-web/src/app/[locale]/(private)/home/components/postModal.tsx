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
      <div className="flex flex-col gap-6 pt-1">
        <div className="relative flex flex-col gap-2">
          <PlayLabel.Primary>
            <PlayInput.Area
              onChange={(e) => setPostText(e.target.value)}
              placeholder="your-post"
              value={postText}
              className="w-full min-h-35 rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all resize-none"
            />
          </PlayLabel.Primary>

          <div className="flex justify-end">
            <PlayText.Span
              texts={[
                {
                  text: `characters`,
                  values: { characters: postText.length },
                  className: "text-xs text-slate-400",
                },
              ]}
            />
          </div>
        </div>

        {error && (
          <PlayText.Primary id={error} className="text-sm text-rose-400" />
        )}

        {postText.trim().length > 0 && (
          <div className="pt-2">
            <PlayButton.Primary
              onClick={handleCreatePost}
              title={isLoading ? "creating-post" : "create-post"}
              className="w-full rounded-2xl bg-white py-3.5 shadow-lg shadow-white/5 hover:bg-slate-100 transition-all font-semibold text-slate-950"
            />
          </div>
        )}
      </div>
    </PlayModal.Primary>
  );
};
