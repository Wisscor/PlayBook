"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { usePostController } from "@/services/post";
import { useTranslations } from "next-intl";
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

  let postsContent: React.ReactNode;
  if (isLoading && totalPosts === 0) {
    postsContent = (
      <PlayText.Primary
        id="loading"
        className="py-12 text-center text-slate-300"
      />
    );
  } else if (totalPosts === 0 && !isLoading) {
    postsContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center">
        <PlayText.Primary
          id="no-posts"
          className="text-base font-medium text-amber-400"
        />
      </div>
    );
  } else {
    postsContent = (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center my-6 space-x-4">
          {postPageNumber > 1 && (
            <button
              onClick={() => {
                void loadPosts(connectedUser?.id, postPageNumber - 1);
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="previous"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
          <PlayText.Primary
            content={
              postPages > 0
                ? `${postPageNumber}/${postPages}`
                : postPageNumber.toString()
            }
            className="text-sm text-slate-400 font-bold transition-color"
          />
          {postPageNumber < postPages && (
            <button
              onClick={() => {
                void loadPosts(connectedUser?.id, postPageNumber + 1);
              }}
              className="cursor-pointer"
            >
              <PlayText.Primary
                id="next"
                className="text-sm text-slate-400 hover:text-slate-200 transition-color"
              />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onDelete={() => {
                void deletePost(post.id, () => {
                  window.location.reload();
                });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <PlayText.Primary
          id="my-posts"
          className="text-xl font-bold tracking-tight text-white"
        />
        <PlayText.Span
          texts={[
            {
              content: `${totalPosts} ${totalPosts === 1 ? t("post") : t("posts")}`,
              className:
                "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400",
            },
          ]}
        />
      </div>

      {postsContent}
    </div>
  );
};
