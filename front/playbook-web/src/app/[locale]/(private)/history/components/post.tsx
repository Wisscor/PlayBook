"use client";

import React from "react";
import { createPortal } from "react-dom";
import { PlayButton } from "@/components/ui/Button";
import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import { PostData } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";

export interface PostProps {
  post: PostData;
  onDelete?: (id: string) => void;
}

export const Post: React.FC<PostProps> = ({ post, onDelete }) => {
  const { goUserProfile } = useNavigation();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const author = post.author;
  const authorId = author?.id;
  const authorName = author
    ? `${author.firstname} ${author.lastname}`
    : undefined;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-secondary/20 text-stone-100 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-2xl hover:shadow-primary/15">
      <span
        aria-hidden
        className="absolute inset-y-0 inset-s-0 w-1 bg-linear-to-b from-primary to-extra opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950/30 px-5 py-3 ps-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-extra to-primary text-[11px] font-bold text-white shadow-md">
            {author
              ? `${author.firstname?.charAt(0) ?? ""}${author.lastname?.charAt(0) ?? ""}`.toUpperCase()
              : "•"}
          </div>

          {authorId ? (
            <button
              type="button"
              onClick={() => goUserProfile(authorId)}
              aria-label={`View ${authorName}'s profile`}
              className="min-w-0 cursor-pointer rounded text-start transition-colors duration-300 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <PlayText.Span
                texts={[
                  {
                    content: authorName ?? "Post",
                    className:
                      "truncate text-xs font-semibold text-stone-100 transition-colors duration-300 group-hover:text-amber-100",
                  },
                ]}
              />
            </button>
          ) : (
            <PlayText.Span
              texts={[
                {
                  content: authorName ?? "Post",
                  className: "text-xs font-semibold text-stone-100",
                },
              ]}
            />
          )}
        </div>
        <PlayText.Primary
          content={new Date(post.created_at).toLocaleDateString()}
          className="shrink-0 text-xs font-medium uppercase tracking-wider text-stone-400"
        />
      </div>

      <div className="relative flex-1 p-5 ps-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-e-4 top-1 select-none font-serif text-6xl leading-none text-primary/20 transition-colors duration-300 group-hover:text-primary/35"
        >
          &rdquo;
        </span>
        <PlayText.Primary
          content={`"${post.caption}"`}
          className="relative text-sm font-normal italic leading-relaxed text-stone-100 wrap-break-word md:text-base"
        />
      </div>

      {onDelete && (
        <div className="flex justify-end border-t border-white/10 bg-neutral-950/30 px-5 py-2.5">
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/60 hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:translate-y-0 active:scale-95"
          >
            <PlayText.Span texts={[{ text: "delete" }]} />
          </button>
        </div>
      )}

      {isDeleteOpen &&
        onDelete &&
        createPortal(
          <PlayModal.Primary
            isOpen={isDeleteOpen}
            close={() => setIsDeleteOpen(false)}
            title="delete-post"
          >
            <div className="flex flex-col gap-6 pt-1">
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <PlayText.Primary
                  id="delete-post-warning"
                  className="text-sm leading-relaxed text-rose-100"
                />
                <PlayText.Primary
                  content={`"${post.caption}"`}
                  className="line-clamp-3 rounded-xl border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs italic text-stone-300 wrap-break-word"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <PlayButton.Secondary
                  title="cancel"
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-full py-3"
                />
                <PlayButton.Primary
                  title="confirm-delete-post"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    onDelete(post.id);
                  }}
                  className="w-full from-rose-600 to-rose-700 py-3 shadow-rose-600/30 hover:shadow-rose-600/40"
                />
              </div>
            </div>
          </PlayModal.Primary>,
          document.body,
        )}
    </article>
  );
};
