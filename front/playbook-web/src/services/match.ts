import {
  MatchAnnouncementRequestData,
  MatchAnnouncement,
  MatchAnnouncementPaginated,
  Sport,
} from "@/types/api";
import { api } from "./api";
import React from "react";
import { useAuth } from "@/hooks/contexts/authContext";

export const useMatchController = () => {
  const [sports, setSports] = React.useState<Sport[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [pages, setPages] = React.useState<number>(0);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [matches, setMatches] = React.useState<MatchAnnouncement[]>([]);
  const { setIsLoading } = useAuth();

  const addMatch = async (
    form: MatchAnnouncementRequestData,
    onSuccess: () => void,
  ) => {
    await api
      .post("/match-announcements", {
        title: form.title.trim(),
        sport_id: form.sport_id,
        remaining_player_slots: form.remaining_player_slots,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      })
      .then((res) => {
        if (res.status === 201) {
          onSuccess();
        }
      });
  };

  const getSports = async (onSuccess: () => void, onError: () => void) => {
    await api
      .get<Sport[]>("/sports")
      .then((res) => {
        if (res.status == 200) {
          setSports(res.data);
          onSuccess();
        }
      })
      .catch((error) => {
        onError();
        console.error("Error fetching sports >>>>", error);
      });
  };

  const loadMatches = async (
    userId?: string,
    page?: number,
    size?: number,
    onError?: () => void,
    additionalFilters?: {
      field: string;
      value: string;
    }[],
  ) => {
    let userFilter = userId ? `&organizer_id=${userId}` : "";
    additionalFilters?.map((filter) => {
      if (!filter.field || !filter.value || filter.value.length == 0) return;
      userFilter = userFilter.concat(`&${filter.field}=${filter.value}`);
    });

    const defaultParams = `page=${page}${userFilter}&size=${size}&sort_by=start_time&sort_order=asc`;

    setIsLoading(true);

    await api
      .get<MatchAnnouncementPaginated>(`/match-announcements?${defaultParams}`)
      .then((res) => {
        if (res.status === 200) {
          setMatches(res.data.items);
          setPageNumber(res.data.page);
          setPages(res.data.pages);
          setTotal(res.data.total);
        }
      })
      .catch((error) => {
        console.error("Error fetching matches >>>>", error);
        onError?.();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const deleteMatch = async (
    id: string,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    await api
      .delete(`/match-announcements/${id}`)
      .then((res) => {
        if (res.status === 204) {
          onSuccess();
        }
      })
      .catch((error) => {
        console.error("Error deleting match >>>>", error);
        onError();
      });
  };

  const updateMatch = async (
    id: string,
    payload: MatchAnnouncementRequestData,
    status: string,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    await api
      .patch<MatchAnnouncement>(`/match-announcements/${id}`, {
        ...payload,
        match_status: status,
      })
      .then((res) => {
        if (res.status === 200) {
          onSuccess();
        }
      })
      .catch((error) => {
        console.error("Error updating match");
        onError();
      });
  };

  const requestToJoinMatch = async (
    announcementId: string,
    onSuccess: () => void,
    onError: (error: unknown) => void,
  ) => {
    await api
      .post(`/match-announcements/${announcementId}/play-requests`)
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          onSuccess();
        }
      })
      .catch((error) => {
        console.error("Error requesting to join match:", {
          message: error?.message,
          status: error?.status,
          details: error?.details,
        });
        onError(error);
      });
  };

  return {
    addMatch,
    getSports,
    sports,
    loadMatches,
    matches,
    pageNumber,
    deleteMatch,
    updateMatch,
    requestToJoinMatch,
    pages,
    total,
  };
};
