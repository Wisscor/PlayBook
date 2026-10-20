import { PlayText } from "@/components/ui/Text";
import React from "react";

export const PostsFeed: React.FC<{
  posts: {
    id: number;
    author: string;
    username: string;
    avatar: string;
    createdAt: string;
    content: string;
  }[];
}> = ({ posts }) => {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr from-indigo-900 to-indigo-600 font-bold text-sm text-white shadow-md">
                {post.avatar}
              </div>
              <div>
                <PlayText.Primary
                  content={post.author}
                  className="font-bold text-sm text-white"
                />
                <PlayText.Primary
                  content={`@${post.username} • ${getTimeAgo(post.createdAt)}`}
                  className="text-xs text-slate-400"
                />
              </div>
            </div>
          </div>

          <PlayText.Primary
            content={post.content}
            className="text-sm text-slate-200 leading-relaxed"
          />
        </div>
      ))}
    </div>
  );
};
