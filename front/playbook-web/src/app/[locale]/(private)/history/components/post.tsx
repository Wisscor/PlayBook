"use client";

import React from "react";
import Image from "next/image";
import { PlayText } from "@/components/ui/Text";

export interface PostProps {
  post: {
    id: number;
    date: string;
    post: string;
    author?: {
      name?: string;
      avatar?: string;
    };
  };
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const Post: React.FC<PostProps> = ({ post, onEdit, onDelete }) => {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-3">
        {post.author ? (
          <div className="flex items-center gap-2.5">
            {post.author.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name || "Author"}
                width={24}
                height={24}
                className="rounded-full object-cover ring-1 ring-white/20"
              />
            )}
            <PlayText.Span
              texts={[
                {
                  content: post.author.name,
                  className: "text-xs font-semibold text-slate-200",
                },
              ]}
            />
          </div>
        ) : (
          <div />
        )}

        <PlayText.Primary
          content={post.date}
          className="text-xs font-medium uppercase tracking-wider text-slate-400"
        />
      </div>

      <div className="flex-1 p-5">
        <PlayText.Primary
          content={`"${post.post}"`}
          className="text-sm md:text-base leading-relaxed text-slate-100 font-normal italic"
        />
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-2.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(post.id)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Edit post"
            >
              <Image
                alt="edit icon"
                src="/icons/edit.png"
                width={14}
                height={14}
                className="opacity-80 invert"
              />
              <PlayText.Span
                texts={[{ text: "edit", className: "hidden sm:inline" }]}
              />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer"
              aria-label="Delete post"
            >
              <Image
                alt="delete icon"
                src="/icons/delete.png"
                width={14}
                height={14}
                className="opacity-80"
              />
              <PlayText.Span
                texts={[{ text: "delete", className: "hidden sm:inline" }]}
              />
            </button>
          )}
        </div>
      )}
    </article>
  );
};
