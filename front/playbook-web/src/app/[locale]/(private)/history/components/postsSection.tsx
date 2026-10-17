"use client";

import { PlayText } from "@/components/ui/Text";
import React, { useState } from "react";
import { Post } from "./post";

export const PostsSection: React.FC = () => {
  const [posts, setPosts] = useState([
    {
      id: 0,
      date: "2026-06-01",
      post: "This is a sample post content.",
    },
    {
      id: 1,
      date: "2026-06-01",
      post: "This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content.",
    },
  ]);

  const handleEdit = (id: number) => {
    console.log("Edit post", id);
  };

  const handleDelete = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <PlayText.Primary
          id="my-posts"
          className="text-xl font-bold tracking-tight text-white"
        />
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
          {posts.length} {posts.length === 1 ? "Post" : "Posts"}
        </span>
      </div>

      <div>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <PlayText.Primary
              id="no-posts"
              className="text-base font-medium text-amber-400"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsSection;
