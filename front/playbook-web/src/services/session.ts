import { ApiError, Session } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";


export const useSession = (enabled: boolean) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [revokingId, setRevokingId] = useState<string | undefined>(undefined);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    await api.get<Session[]>("/auth/sessions").then((res) => {
      if (res.status == 200) {
        setSessions(res.data)
      }
    }).catch((error: ApiError) => {
      setError(error.errorCode ?? "unable-to-load-sessions");
    }).finally(() => {
      setIsLoading(false);
      setHasLoaded(true);
    })
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void api.get<Session[]>("/auth/sessions").then((data) => {
      if (active) setSessions(data.data);
    })
      .catch((error: ApiError) => {
        if (active) setError(error.errorCode ?? "unable-to-load-sessions");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  const revoke = async (id: string) => {
    setRevokingId(id);
    setError(undefined);

    await api.delete(`/auth/sessions/${id}`).then(() => {
      setSessions((current) =>
        current.filter((session) => session.id !== id),
      );
    }).catch((error: ApiError) => {
      setError(error.errorCode ?? "unable-to-logout-session");
    }).finally(() => {
      setRevokingId(undefined);
    });


  };

  const revokeAll = async () => {
    setIsRevokingAll(true);
    setError(undefined);

    try {
      await api.delete("/auth/sessions");
      setSessions([]);
      return true;
    } catch {
      setError("unable-to-logout-all-sessions");
      return false;
    } finally {
      setIsRevokingAll(false);
    }
  };

  return {
    sessions,
    isLoading: isLoading || (enabled && !hasLoaded),
    error,
    revokingId,
    isRevokingAll,
    reload: load,
    revoke,
    revokeAll,
  };
};
