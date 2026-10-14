import { PlayText } from "@/components/ui/Text";
import React from "react";
import { Post } from "./post";

export const PostsSection: React.FC = () => {
  const posts = [
    {
      id: 0,
      date: "2023-06-01",
      post: "This is a sample post content.",
    },
    {
      id: 1,
      date: "2023-06-01",
      post: "This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content. This is a sample post content.",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-8 bg-white shadow-2xs w-full rounded-lg">
      <PlayText.Primary
        id="my-posts"
        className="text-lg text-black font-bold"
      />

      <div>
        {posts.length == 0 ? (
          <PlayText.Primary
            id="no-posts"
            className="text-md text-center text-warning "
          />
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              return (
                <Post
                  key={post.id}
                  post={post}
                  onEdit={(id) => console.log("Edit post", id)}
                  onDelete={(id) => console.log("Delete post", id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
