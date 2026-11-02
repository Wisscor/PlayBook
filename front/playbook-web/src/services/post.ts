import { useAuth } from "@/hooks/contexts/authContext";
import { api } from "./api";
import {
  ApiError,
  Feed,
  FeedPaginated,
  PostData,
  PostPaginated,
} from "@/types/api";
import React from "react";
import { pageSize } from "@/lib/constants";

export const usePostController = () => {
  const { setIsLoading } = useAuth();
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [postPageNumber, setPostPageNumber] = React.useState(1);
  const [postPages, setPostPages] = React.useState(1);
  const [totalPosts, setTotalPosts] = React.useState(1);

  const [feeds, setFeeds] = React.useState<Feed[]>([]);
  const [feedPageNumber, setFeedPageNumber] = React.useState(1);
  const [feedPages, setFeedPages] = React.useState(1);
  const [totalFeeds, setTotalFeeds] = React.useState(1);

  const addPost = async (
    post: string,
    onSuccess: () => void,
    onError: (error: any) => void,
  ) => {
    setIsLoading(true);
    await api
      .post("/posts", { caption: post.trim() })
      .then((res) => {
        if (res.status == 201) {
          onSuccess();
        }
      })
      .catch((error: ApiError) => {
        onError(error.errorCode || "unable-to-create-post");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadPosts = async (userId?: string, pageNumber?: number) => {
    if (!userId) {
      return;
    }
    const defaultParams = `page=${pageNumber}&size=${pageSize}`;
    setIsLoading(true);
    await api
      .get<PostPaginated>(`/posts?${defaultParams}`, {
        params: { user_id: userId },
      })
      .then((res) => {
        if (res.status == 200) {
          setPosts(res.data.items);
          setPostPageNumber(res.data.page);
          setPostPages(res.data.pages);
          setTotalPosts(res.data.total);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadFeeds = async (pageNumber?: number) => {
    const defaultParams = `page=${pageNumber}&size=${pageSize}`;
    setIsLoading(true);
    await api
      .get<FeedPaginated>(`/feed?${defaultParams}`)
      .then((res) => {
        if (res.status == 200) {
          setFeeds(res.data.items);
          setFeedPageNumber(res.data.page);
          setFeedPages(res.data.pages);
          setTotalFeeds(res.data.total);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const deletePost = async (id: string, onSuccess: () => void) => {
    await api
      .delete(`/posts/${id}`)
      .then((res) => {
        if (res.status == 204) {
          onSuccess();
        }
      })
      .catch(() => {});
  };

  return {
    addPost,
    loadPosts,
    posts,
    postPageNumber,
    postPages,
    deletePost,
    totalPosts,
    feeds,
    loadFeeds,
    feedPageNumber,
    feedPages,
    totalFeeds,
  };
};
