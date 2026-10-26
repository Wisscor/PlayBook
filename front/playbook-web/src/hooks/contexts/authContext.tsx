"use client";

import { User } from "@/types/user";
import { api } from "@/services/api";
import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from "react";

type AuthContextType = {
  connectedUser: User | undefined;
  setConnectedUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [connectedUser, setConnectedUser] = React.useState<User | undefined>(
    undefined,
  );

  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    await api
      .get<User>("/users/me")
      .then((res) => {
        setConnectedUser(res.data);
      })
      .catch(() => {
        setConnectedUser(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const value = useMemo(
    () => ({
      connectedUser,
      setConnectedUser,
      isLoading,
      setIsLoading,
      fetchUser,
    }),
    [connectedUser, isLoading, fetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
