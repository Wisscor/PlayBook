"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { usePostController } from "@/services/post";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect } from "react";
import { Post } from "./post";
import { useProfileController } from "@/services/profile";

export const PostsSection: React.FC = () => {
  const t = useTranslations();
  const {
    loadPosts,
    deletePost,
    posts,
    postPageNumber,
    postPages,
    totalPosts,
  } = usePostController();
  const { connectedUser, isLoading } = useAuth();
  const { fetchUser } = useProfileController();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUser(() => {
        if (connectedUser?.id) {
          void loadPosts(connectedUser.id, postPageNumber);
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [connectedUser?.id]);

  const refreshCurrentPage = () => {
    if (!connectedUser) return;
    const page =
      posts.length === 1 && postPageNumber > 1
        ? postPageNumber - 1
        : postPageNumber;
    void loadPosts(connectedUser.id, page);
  };

  let postsContent: React.ReactNode;
  if (isLoading && totalPosts === 0) {
    postsContent = (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 150}ms` }}
            className="flex animate-pulse flex-col gap-3 rounded-2xl border border-white/10 bg-secondary/20 p-5"
          >
            <div className="h-3 w-1/4 rounded-full bg-secondary/50" />
            <div className="h-3 w-full rounded-full bg-secondary/30" />
            <div className="h-3 w-2/3 rounded-full bg-secondary/30" />
          </div>
        ))}
        <PlayText.Primary
          id="loading"
          className="py-2 text-center text-sm text-stone-400"
        />
      </div>
    );
  } else if (totalPosts === 0 && !isLoading) {
    postsContent = (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-secondary/10 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-linear-to-br from-primary/40 to-extra/40">
          <Image
            alt="no posts"
            src={"/icons/addition.png"}
            width={32}
            height={32}
            className="opacity-70"
          />
        </div>
        <PlayText.Primary
          id="no-posts"
          className="text-base font-medium text-amber-300"
        />
      </div>
    );
  } else {
    postsContent = (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="ps-anim animate-[ps-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]"
            >
              <Post
                post={post}
                onDelete={() => {
                  void deletePost(post.id, () => {
                    refreshCurrentPage();
                  });
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-secondary/30 p-1.5 backdrop-blur-md">
          {postPageNumber > 1 && (
            <button
              onClick={() => {
                void loadPosts(connectedUser?.id, postPageNumber - 1);
              }}
              className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:translate-x-0.5"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <PlayText.Primary
                id="previous"
                className="text-sm text-stone-300 transition-colors group-hover:text-white"
              />
            </button>
          )}
          <PlayText.Primary
            content={
              postPages > 0
                ? `${postPageNumber}/${postPages}`
                : postPageNumber.toString()
            }
            className="rounded-full bg-linear-to-r from-primary to-extra px-4 py-1.5 text-sm font-bold tabular-nums text-white shadow-md shadow-primary/30"
          />
          {postPageNumber < postPages && (
            <button
              onClick={() => {
                void loadPosts(connectedUser?.id, postPageNumber + 1);
              }}
              className="group flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-300 hover:bg-primary/25 active:scale-95"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-stone-300 transition-colors group-hover:text-white"
              />
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-stone-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-amber-200 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <style>{`
        @keyframes ps-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ps-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id="my-posts"
            className="text-xl font-bold tracking-tight text-stone-100"
          />
        </div>
        <PlayText.Span
          texts={[
            {
              content: `${totalPosts} ${totalPosts === 1 ? t("post") : t("posts")}`,
              className:
                "rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold tabular-nums text-amber-200",
            },
          ]}
        />
      </div>

      {postsContent}
    </div>
  );
};
