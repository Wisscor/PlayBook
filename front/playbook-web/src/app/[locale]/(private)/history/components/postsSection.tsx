import { PlayText } from "@/components/ui/Text";
import { api } from "@/services/api";
import axios from "axios";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { Post } from "./post";

export const PostsSection: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const [posts, setPosts] = React.useState<
    Array<{
      id: string;
      caption: string;
      created_at: string;
      updated_at: string;
    }>
  >([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadPosts = React.useCallback(
    async (cursor?: string) => {
      const isLoadingMoreRequest = Boolean(cursor);
      if (isLoadingMoreRequest) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const userResponse = await api.get<{ id: string }>("/users/me");
        const response = await api.get<{
          items: Array<{
            id: string;
            caption: string;
            created_at: string;
            updated_at: string;
          }>;
          next_cursor: string | null;
        }>(`/users/${userResponse.data.id}/posts`, {
          params: { limit: 20, ...(cursor ? { cursor } : {}) },
        });

        setPosts((current) =>
          cursor ? [...current, ...response.data.items] : response.data.items,
        );
        setNextCursor(response.data.next_cursor);
      } catch (requestError) {
        if (axios.isAxiosError(requestError)) {
          const detail = requestError.response?.data?.detail;
          setError(
            typeof detail === "string" ? detail : t("posts-load-error"),
          );
        } else {
          setError(t("posts-load-error"));
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [t],
  );

  React.useEffect(() => {
    // The request synchronizes this client component with the authenticated API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts();
  }, [loadPosts]);

  return (
    <div className="flex flex-col gap-8 p-8 bg-white shadow-2xs w-full rounded-lg">
      <PlayText.Primary
        id="my-posts"
        className="text-lg text-black font-bold"
      />

      <div>
        {isLoading ? (
          <PlayText.Primary
            id="loading-posts"
            className="text-md text-center text-gray"
          />
        ) : error ? (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        ) : posts.length === 0 ? (
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
                  post={{
                    id: post.id,
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(post.created_at)),
                    post: post.caption,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
      {nextCursor && !isLoading && !error && (
        <button
          type="button"
          onClick={() => void loadPosts(nextCursor)}
          disabled={isLoadingMore}
          className="self-center rounded-xl bg-primary px-6 py-3 text-white disabled:opacity-50"
        >
          {isLoadingMore ? t("loading-posts") : t("load-more")}
        </button>
      )}
    </div>
  );
};
