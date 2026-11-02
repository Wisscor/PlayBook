import { useAuth } from "@/hooks/contexts/authContext";
import { pageSize } from "@/lib/constants";
import { FollowDataPaginated } from "@/types/api";
import { UserSummary } from "@/types/user";
import React from "react";
import { api } from "./api";
import { useUserController } from "./user";

export const useFollowerController = () => {
  const { setIsLoading } = useAuth();
  const { getUser } = useUserController();
  const [followPageNumber, setFollowPageNumber] = React.useState(1);
  const [followPages, setFollowPages] = React.useState(1);
  const [totalFollowers, setTotalFollowers] = React.useState(0);
  const [followers, setFollowers] = React.useState<
    (UserSummary & { isFollowing: boolean })[]
  >([]);

  const loadUsers = async (
    isFollowingView: boolean,
    userId: string,
    pageNumber: number,
    onError: (err: string) => void,
  ) => {
    setIsLoading(true);

    const path = isFollowingView ? "following" : "followers";
    await api
      .get<FollowDataPaginated>(
        `/users/${userId}/${path}?page=${pageNumber}&size=${pageSize}`,
      )
      .then(async (res) => {
        if (res.status == 200) {
          setFollowPageNumber(res.data.page);
          setFollowPages(res.data.pages);
          setTotalFollowers(res.data.total);
          const users = await Promise.all(
            res.data.items.map(async (follower) => {
              const user = await getUser(follower.id);
              if (user) {
                return {
                  ...follower,
                  isFollowing: user.is_following ?? false,
                };
              }
            }),
          );

          setFollowers(
            users.filter(
              (user): user is UserSummary & { isFollowing: boolean } =>
                user !== undefined,
            ),
          );
        }
      })
      .catch(() => {
        onError("Unable to load follow relationships");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const unfollow = async (id: string, onSuccess: () => void) => {
    await api
      .delete(`/users/${id}/follow`)
      .then((res) => {
        if (res.status == 204) {
          onSuccess();
        }
      })
      .catch(() => {});
  };

  const follow = async (id: string, onSuccess: () => void) => {
    await api
      .post(`/users/${id}/follow`)
      .then((res) => {
        if (res.status == 201) {
          onSuccess();
        }
      })
      .catch(() => {});
  };

  return {
    loadUsers,
    followPageNumber,
    followPages,
    totalFollowers,
    followers,
    unfollow,
    follow,
  };
};
