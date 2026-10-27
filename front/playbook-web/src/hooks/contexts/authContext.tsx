"use client";

import { User } from "@/types/user";
import { api } from "@/services/api";
import React, { createContext, useContext, useMemo } from "react";

type AuthContextType = {
  connectedUser: User | undefined;
  setConnectedUser: React.Dispatch<React.SetStateAction<User | undefined>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [connectedUser, setConnectedUser] = React.useState<User | undefined>(
    undefined,
  );

  const [isLoading, setIsLoading] = React.useState(true);
  //Updated authContext.tsx to restore the current user on startup : GET /users/me
  //which means that the user's session will be restored when the application starts
  // Fetch the connected user when the component mounts
  React.useEffect(() => {
    api
      .get<User>("/users/me")
      .then((response) => setConnectedUser(response.data))
      .catch(() => setConnectedUser(undefined))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      connectedUser,
      setConnectedUser,
      isLoading,
      setIsLoading,
    }),
    [connectedUser, isLoading],
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
