import React from "react";
import Image from "next/image";
import { PlayText } from "@/components/ui/Text";

export interface PostProps {
  post: {
    id: string;
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
    <article className="group relative flex flex-col rounded-xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="py-3 px-5 flex items-center justify-between bg-linear-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-900/40 border-b border-gray-100 dark:border-gray-800/80">
        {post.author ? (
          <div className="flex items-center gap-2.5">
            {post.author.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name || "Author"}
                width={24}
                height={24}
                className="rounded-full object-cover"
              />
            )}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {post.author.name}
            </span>
          </div>
        ) : (
          <div />
        )}

        <PlayText.Primary
          content={post.date}
          className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase"
        />
      </div>

      <div className="py-5 px-6 flex-1 bg-white dark:bg-gray-900">
        <PlayText.Primary
          content={`"${post.post}"`}
          className="text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-100 font-normal italic"
        />
      </div>

      <div className="py-2.5 px-5 flex items-center justify-end gap-3 bg-gray-50/80 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800/80">
        {onEdit && (
          <button
            onClick={() => onEdit(post.id)}
            className="p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1.5 text-xs font-medium"
            aria-label="Edit post"
          >
            <Image
              alt="edit icon"
              src={"/icons/edit-white.png"}
              width={16}
              height={16}
              className="opacity-75 group-hover:opacity-100 transition-opacity"
            />
            <PlayText.Span
              texts={[{ text: "edit", className: "hidden sm:inline" }]}
            />
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1.5 text-xs font-medium"
            aria-label="Delete post"
          >
            <Image
              alt="delete icon"
              src={"/icons/delete.png"}
              width={16}
              height={16}
              className="opacity-75 group-hover:opacity-100 transition-opacity"
            />
            <PlayText.Span
              texts={[{ text: "delete", className: "hidden sm:inline" }]}
            />
          </button>
        )}
      </div>
    </article>
  );
};
