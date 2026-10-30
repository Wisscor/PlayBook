"use client";

import React from "react";
import { PlayText } from "@/components/ui/Text";
import { Post as PostData } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";

export interface PostProps {
  post: PostData;
  onDelete?: (id: string) => void;
}

export const Post: React.FC<PostProps> = ({ post, onDelete }) => {
  const { goUserProfile } = useNavigation();
  const author = post.author ?? post.user;
  const authorId = author?.id;
  const authorName = author
    ? `${author.firstname} ${author.lastname}`
    : undefined;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-3">
        {authorId ? (
          <button
            type="button"
            onClick={() => goUserProfile(authorId)}
            aria-label={`View ${authorName}'s profile`}
            className="cursor-pointer rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <PlayText.Span
              texts={[
                {
                  content: authorName ?? "Post",
                  className: "text-xs font-semibold text-slate-200",
                },
              ]}
            />
          </button>
        ) : (
          <PlayText.Span
            texts={[
              {
                content: authorName ?? "Post",
                className: "text-xs font-semibold text-slate-200",
              },
            ]}
          />
        )}
        <PlayText.Primary
          content={new Date(post.created_at).toLocaleDateString()}
          className="text-xs font-medium uppercase tracking-wider text-slate-400"
        />
      </div>
      <div className="flex-1 p-5">
        <PlayText.Primary
          content={`"${post.caption}"`}
          className="text-sm font-normal italic leading-relaxed text-slate-100 md:text-base"
        />
      </div>
      {onDelete && (
        <div className="flex justify-end border-t border-white/10 bg-black/20 px-5 py-2.5">
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20"
          >
            <PlayText.Span texts={[{ text: "delete" }]} />
          </button>
        </div>
      )}
    </article>
  );
};
