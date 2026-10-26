import { useAuth } from "@/hooks/contexts/authContext";
import { api } from "./api";
import { PostData, PostPaginated } from "@/types/api";
import React from "react";

export const usePostController = () => {
  const { setIsLoading } = useAuth();
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [total, setTotal] = React.useState(1);
  const [posts, setPosts] = React.useState<PostData[]>([]);

  const addPost = async (
    post: string,
    onSuccess: () => void,
    onError: (error: any) => void,
  ) => {
    setIsLoading(true);
    try {
      await api
        .post("/posts", { caption: post.trim() })
        .then((res) => {
          if (res.status == 201) {
            onSuccess();
          }
        })
        .catch((error) => {
          onError(error);
        });
    } catch (requestError) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (userId?: string, pageNumber?: number) => {
    if (!userId) {
      console.error("User ID is undefined. Cannot load posts.");
      return;
    }
    const defaultParams = `page=${pageNumber}&size=1`;
    setIsLoading(true);
    await api
      .get<PostPaginated>(`/posts?${defaultParams}`, {
        params: { user_id: userId },
      })
      .then((res) => {
        if (res.status == 200) {
          setPosts(res.data.items);
          setPageNumber(res.data.page);
          setPages(res.data.pages);
          setTotal(res.data.total);
        }
      })
      .catch((error) => {
        console.error("Unable to load posts:", error);
      })
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
      .catch((error) => {
        console.error("Unable to delete post:", error);
      });
  };

  return {
    addPost,
    loadPosts,
    posts,
    pageNumber,
    pages,
    deletePost,
    total,
  };
};
