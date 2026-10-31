import { User, UserPaginated, UserSummary } from "@/types/user";
import { api } from "./api";
import { pageSize } from "@/lib/constants";
import React from "react";
import { useAuth } from "@/hooks/contexts/authContext";
import { ApiError } from "@/types/api";
import { ChatConversation } from "@/hooks/contexts/chatContext";

export const useUserController = () => {
  const { setIsLoading } = useAuth();
  const [users, setUsers] = React.useState<UserSummary[]>([]);
  const [userPageNumber, setUserPageNumber] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(1);
  const [userPages, setUserPages] = React.useState(1);
  const [peerAvatars, setPeerAvatars] = React.useState<Record<string, string>>(
    {},
  );

  const loadUsers = async (
    pageNumber: number,
    onError?: (error: string) => void,
    searchQuery?: string,
  ) => {
    let defaultParams = `page=${pageNumber}&size=${pageSize}`;
    if (searchQuery && searchQuery?.length >= 1) {
      defaultParams += `&search=${searchQuery}`;
    }

    setIsLoading(true);

    await api
      .get<UserPaginated>(`/users?${defaultParams}`)
      .then((res) => {
        if (res.status == 200) {
          setUsers(res.data.items);
          setTotalUsers(res.data.total);
          setUserPages(res.data.pages);
          setUserPageNumber(res.data.page);
        }
      })
      .catch((error: ApiError) => {
        onError?.(error?.errorCode || "error-loading-users");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getUser = async (userId: string) => {
    const res = await api.get<User>(`/users/${userId}`);

    if (res.status == 200) {
      return res.data;
    }
    return null;
  };

  const loadPeerAvatars = async (
    conversations: ChatConversation[],
    isMounted: boolean,
  ) => {
    const profiles = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          const response = await api.get<{ avatar?: string }>(
            `/users/${conversation.peer_id}`,
          );
          return [conversation.peer_id, response.data.avatar] as const;
        } catch {
          return [conversation.peer_id, undefined] as const;
        }
      }),
    );

    if (isMounted) {
      setPeerAvatars(
        Object.fromEntries(
          profiles.filter(([, avatar]) => avatar) as [string, string][],
        ),
      );
    }
  };

  return {
    loadUsers,
    users,
    userPageNumber,
    totalUsers,
    userPages,
    getUser,
    loadPeerAvatars,
    peerAvatars,
  };
};
