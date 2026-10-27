import { PlayText } from "@/components/ui/Text";
import React from "react";
import { Link } from "../../../../../../i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { Feed } from "@/types/api";

export const PostsFeed: React.FC<{
  feeds: Feed[];
}> = ({ feeds }) => {
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
      {feeds.map((feed) => (
        <div
          key={feed.id}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-4"
        >
          <Link
            href={ROUTES.USER_PROFILE}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr from-indigo-900 to-indigo-600 font-bold text-sm text-white shadow-md">
                {feed.author
                  ? `${feed.author.firstname.charAt(0)}${feed.author.lastname.charAt(0)}`
                  : "P"}
              </div>
              <div>
                <PlayText.Primary
                  content={
                    feed.author
                      ? `${feed.author.firstname} ${feed.author.lastname}`
                      : "Feed"
                  }
                  className="font-bold text-sm text-white"
                />
                <PlayText.Primary
                  content={`@${feed.author?.username ?? "unknown"} • ${getTimeAgo(feed.created_at)}`}
                  className="text-xs text-slate-400"
                />
              </div>
            </div>
          </Link>

          <PlayText.Primary
            content={feed.caption}
            className="text-sm text-slate-200 leading-relaxed"
          />
        </div>
      ))}
    </div>
  );
};
