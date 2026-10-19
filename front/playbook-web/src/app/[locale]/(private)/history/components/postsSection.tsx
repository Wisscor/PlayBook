"use client";

import { PlayText } from "@/components/ui/Text";
import { api } from "@/services/api";
import { Post as PostData } from "@/types/api";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { Post } from "./post";

export const PostsSection: React.FC = () => {
  const t = useTranslations();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const profile = await api.get<{ id: string }>("/users/me");
      const response = await api.get<PostData[]>("/posts", {
        params: { user_id: profile.data.id },
      });
      setPosts(response.data);
    } catch (error) {
      console.error("Unable to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadPosts, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
    } catch (error) {
      console.error("Unable to delete post:", error);
    }
  };

  let postsContent: React.ReactNode;
  if (isLoading) {
    postsContent = (
      <p className="py-12 text-center text-slate-300">Loading...</p>
    );
  } else if (posts.length === 0) {
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
        {posts.map((post) => (
          <Post key={post.id} post={post} onDelete={handleDelete} />
        ))}
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
              content: `${posts.length} ${posts.length === 1 ? t("post") : t("posts")}`,
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
