import { PlayText } from "@/components/ui/Text";
import React from "react";
import { Feed } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";
import { PostDetail } from "./postDetail";

export const PostsFeed: React.FC<{
  feeds: Feed[];
}> = ({ feeds }) => {
  const { goUserProfile } = useNavigation();
  const [postModalOpen, setPostModalOpen] = React.useState(false);
  const [selectedPostText, setSelectedPostText] = React.useState<
    undefined | string
  >(undefined);

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
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {feeds.map((feed, index) => {
          const authorInitials = feed.author
            ? `${feed.author.firstname.charAt(0)}${feed.author.lastname.charAt(0)}`
            : "P";

          return (
            <article
              key={feed.id}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              className="cm-anim group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 animate-[cm-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards] hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/10 hover:shadow-2xl hover:shadow-primary/15"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 inset-s-0 w-1 bg-linear-to-b from-primary to-extra opacity-70 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-e-5 top-2 select-none font-serif text-7xl leading-none text-primary/20 transition-colors duration-300 group-hover:text-primary/35"
              >
                &rdquo;
              </span>

              <button
                type="button"
                onClick={() => goUserProfile(feed.author.id)}
                aria-label={`View ${feed.author.firstname} ${feed.author.lastname}'s profile`}
                className="group/author relative flex w-fit max-w-full cursor-pointer items-center gap-3 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <div className="shrink-0 rounded-full bg-linear-to-tr from-primary via-amber-200/60 to-extra p-0.5 transition-transform duration-300 group-hover/author:scale-105">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-bold text-white">
                    {feed.author?.avatar ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${feed.author.avatar}`}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      authorInitials
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <PlayText.Primary
                    content={
                      feed.author
                        ? `${feed.author.firstname} ${feed.author.lastname}`
                        : "Feed"
                    }
                    className="truncate text-sm font-bold text-stone-100 transition-colors duration-300 group-hover/author:text-amber-100"
                  />
                  <PlayText.Primary
                    content={`@${feed.author?.username ?? "unknown"} • ${getTimeAgo(feed.created_at)}`}
                    className="truncate text-xs text-stone-400"
                  />
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPostText(feed.caption ?? "");
                  setPostModalOpen(true);
                }}
                aria-label={`View post by ${feed.author?.firstname ?? "unknown"} ${feed.author?.lastname ?? "unknown"}`}
                className="group/caption relative flex flex-1 cursor-pointer flex-col justify-between gap-4 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <PlayText.Primary
                  content={feed.caption ?? ""}
                  className="line-clamp-4 text-sm leading-relaxed text-stone-300 wrap-break-word"
                />
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 self-end text-stone-500 transition-all duration-300 group-hover/caption:translate-x-1 group-hover/caption:text-amber-200 rtl:rotate-180 rtl:group-hover/caption:-translate-x-1"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </article>
          );
        })}
      </div>

      <PostDetail
        isOpen={postModalOpen}
        close={() => {
          setPostModalOpen(false);
          setSelectedPostText(undefined);
        }}
        postText={selectedPostText}
      />
    </>
  );
};
