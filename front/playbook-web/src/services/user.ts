import { User, UserPaginated, UserSummary } from "@/types/user";
import { api } from "./api";
import { pageSize } from "@/lib/constants";
import React from "react";
import { useAuth } from "@/hooks/contexts/authContext";

export const useUserController = () => {
  const { setIsLoading } = useAuth();
  const [users, setUsers] = React.useState<UserSummary[]>([]);
  const [userPageNumber, setUserPageNumber] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(1);
  const [userPages, setUserPages] = React.useState(1);

  const loadUsers = async (
    pageNumber: number,
    onError?: () => void,
    searchQuery?: string,
  ) => {
    let defaultParams = `page=${pageNumber}&size=${pageSize}`;
    if (searchQuery && searchQuery?.length >= 1) {
      defaultParams += `&search=${searchQuery}`;
    }

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
      .catch((error) => {
        console.error("Error loading users >>>", error);
        onError?.();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getUser = async (userId: string) => {
    try {
      const res = await api.get<User>(`/users/${userId}`);

      if (res.status == 200) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.error("error getting user >>>", error);
    }
  };

  return {
    loadUsers,
    users,
    userPageNumber,
    totalUsers,
    userPages,
    getUser,
  };
};
