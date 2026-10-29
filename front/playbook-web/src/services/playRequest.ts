import React from "react";
import { api } from "./api";
import { PlayRequest, PlayRequestPaginated } from "@/types/api";
import { pageSize } from "@/lib/constants";

export const usePlayRequestsController = () => {
  const [isJoining, setIsJoining] = React.useState<boolean>(false);
  const [requestsTotal, setRequestsTotal] = React.useState<number>(0);
  const [requestsPages, setRequestsPages] = React.useState<number>(0);
  const [requestsPageNumber, setRequestsPageNumber] = React.useState<number>(1);
  const [requests, setRequests] = React.useState<PlayRequest[]>([]);

  const joinMatch = async (matchId: string, onSuccess: () => void) => {
    setIsJoining(true);
    await api
      .post(`/match-announcements/${matchId}/play-requests`)
      .then((res) => {
        if (res.status == 201) {
          onSuccess();
        }
      })
      .catch((error) => {
        console.error("Error joining match >>>>", error);
      })
      .finally(() => {
        setIsJoining(false);
      });
  };

  const loadRequests = async (
    role: "sent" | "received",
    filter?: "all" | "pending" | "accepted" | "declined",
    page?: number,
    size?: number,
  ) => {
    let defaultParams = `&role=${role}`;
    if (filter && filter !== "all") {
      defaultParams += `&status=${filter}`;
    }
    if (page) {
      defaultParams += `&page=${page}&size=${size || pageSize}`;
    }
    await api
      .get<PlayRequestPaginated>("/play-requests?" + defaultParams)
      .then((res) => {
        if (res.status == 200) {
          setRequests(res.data.items);
          setRequestsTotal(res.data.total);
          setRequestsPageNumber(res.data.page);
          setRequestsPages(res.data.pages);
        }
      })
      .catch((error) => {
        console.error("Error fetching requests >>>>", error);
      });
  };

  const loadAnnouncementRequests = async (announcementId: string) => {
    await api
      .get<PlayRequestPaginated>(
        `/match-announcements/${announcementId}/play-requests`,
      )
      .then((res) => {
        if (res.status == 200) {
          setRequests(res.data.items);
        }
      })
      .catch((error) => {
        console.error("Error fetching announcement requests >>>>", error);
      });
  };

  return {
    joinMatch,
    isJoining,
    loadRequests,
    requestsTotal,
    requestsPages,
    requestsPageNumber,
    requests,
    loadAnnouncementRequests,
  };
};
