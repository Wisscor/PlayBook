import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayModal } from "@/components/ui/Modal";
//comment start
import { api } from "@/services/api";
import axios from "axios";
import { useTranslations } from "next-intl";
//comment end
import React from "react";

export const PostModal: React.FC<{
  close: () => void;
  isOpen: boolean;
}> = ({ close, isOpen }) => {
  //comment start
  const t = useTranslations();
  const [postText, setPostText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setPostText("");
    setError(null);
    close();
  };

  const handleSubmit = async () => {
    const caption = postText.trim();
    if (!caption || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.post("/posts", { caption });
      setPostText("");
      setError(null);
      close();
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const detail = requestError.response?.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          setError(detail[0].msg);
        } else {
          setError(t("post-create-error"));
        }
      } else {
        setError(t("post-create-error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  //comment end

  return (
    <PlayModal.Primary
      isOpen={isOpen}
      close={handleClose}
      title="create-post"
    >
      <>
        <div className="flex flex-col gap-4">
          <PlayInput.Area
            onChange={(e) => setPostText(e.target.value)}
            placeholder="your-post"
            value={postText}
            className="bg-primary/20 py-2 text-sm placeholder:text-gray text-black"
          />
        </div>
        {error && (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {postText.trim() && (
          <PlayButton.Primary
          //comment start
            onClick={handleSubmit}
            title={isSubmitting ? "creating-post" : "create-post"}
          //comment end
            className="bg-primary"
            textClassName="text-white"
          />
        )}
      </>
    </PlayModal.Primary>
  );
};
