import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayModal } from "@/components/ui/Modal";
import React from "react";

export const PostModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  const [postText, setPostText] = React.useState<string | undefined>(undefined);

  return (
    <PlayModal.Primary
      isOpen={isOpen}
      close={() => {
        close();
      }}
      title="create-post"
    >
      <>
        <div className="flex flex-col gap-4">
          <PlayInput.Area
            onChange={(e) => setPostText(e.target.value)}
            placeholder="your-post"
            value={postText ?? ""}
            className="bg-primary/20 py-2 text-sm placeholder:text-gray text-black"
          />
        </div>

        {postText && (
          <PlayButton.Primary
            onClick={() => {
              close();
            }}
            title="create-post"
            className="bg-primary"
            textClassName="text-white"
          />
        )}
      </>
    </PlayModal.Primary>
  );
};
