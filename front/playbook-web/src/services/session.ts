import { Session } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

//TODO: delete this mock data once the API is ready
const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const MOCK_SESSIONS: Session[] = [
  {
    id: "s1",
    device: "Chrome on Linux",
    device_type: "desktop",
    ip: "192.168.1.24",
    location: "Casablanca, MA",
    created_at: ago(60 * 24 * 3),
    last_active_at: ago(0),
    is_current: true,
  },
  {
    id: "s2",
    device: "Safari on iPhone",
    device_type: "mobile",
    ip: "41.248.12.9",
    location: "Rabat, MA",
    created_at: ago(60 * 24 * 10),
    last_active_at: ago(42),
    is_current: false,
  },
  {
    id: "s3",
    device: "Firefox on Windows",
    device_type: "desktop",
    ip: "105.157.3.77",
    location: "Paris, FR",
    created_at: ago(60 * 24 * 30),
    last_active_at: ago(60 * 26),
    is_current: false,
  },
];

export const useSession = (enabled: boolean) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [revokingId, setRevokingId] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(undefined);

    // TODO: integrate get call with backend once the API is ready

    return window.setTimeout(() => {
      setSessions(MOCK_SESSIONS);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = load();
    return () => window.clearTimeout(timer);
  }, [enabled, load]);

  const revoke = (id: string, onDone?: () => void) => {
    setRevokingId(id);
    setError(undefined);

    // TODO: integrate revoke call with backend once the API is ready

    window.setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRevokingId(undefined);
      onDone?.();
    }, 600);
  };

  return {
    sessions,
    isLoading,
    error,
    revokingId,
    reload: load,
    revoke,
  };
};
