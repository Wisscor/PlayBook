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
  const [totalPages, setTotalPages] = React.useState<number>(0);
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

  const getSports = async (onError: () => void) => {
    await api
      .get<Sport[]>("/sports")
      .then((res) => {
        if (res.status == 200) {
          setSports(res.data);
        }
      })
      .catch((error) => {
        onError();
        console.error("Error fetching sports >>>>", error);
      });
  };

  const loadMatches = async (
    page: number,
    size: number,
    onError: () => void,
  ) => {
    const defaultParams = `page=${page}&size=${size}&sort_by=start_time&sort_order=asc`;

    setIsLoading(true);
    await api
      .get<MatchAnnouncementPaginated>(`/match-announcements?${defaultParams}`)
      .then((res) => {
        if (res.status === 200) {
          setMatches(res.data.items);
          setPageNumber(res.data.page);
          setTotalPages(res.data.pages);
        }
      })
      .catch((error) => {
        console.error("Error fetching matches >>>>", error);
        onError();
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

  return {
    addMatch,
    getSports,
    sports,
    loadMatches,
    matches,
    pageNumber,
    deleteMatch,
    updateMatch,
    totalPages,
  };
};
