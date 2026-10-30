import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { ApiError, SignInData, SignUpData } from "@/types/api";
import { User } from "@/types/user";
import React from "react";
import { api } from "./api";

export const useAuthController = () => {
  const { connectedUser, setConnectedUser } = useAuth();
  const { goSignIn } = useNavigation();
  const [isWaiting, setIsWaiting] = React.useState(false);

  const signIn = async (data: SignInData, onError: (msg: string) => void) => {
    setIsWaiting(true);
    await api
      .post("/auth/login", data)
      .then((res) => {
        setConnectedUser(res.data);
        goSignIn();
      })
      .catch((error) => {
        onError(error.response?.data?.message || "error-credentials");
      })
      .finally(() => {
        setIsWaiting(false);
      });
  };

  const signUp = async (data: SignUpData, onError: (msg: string) => void) => {
    setIsWaiting(true);

    await api
      .post<User>("/auth/signup", data)
      .then((res) => {
        if (res.status === 200) {
          void signIn(
            { email: res.data.email, password: data.password },
            () => {
              onError("error-credentials");
            },
          );
        }
      })
      .catch((error) => {
        onError(error.errorCode);
      })
      .finally(() => {
        setIsWaiting(false);
      });
  };

  const signOut = async (
    onSuccess: () => void,
    onFailed?: (error?: string) => void,
  ) => {
    await api
      .post("/auth/logout")
      .then((res) => {
        if (res.status === 200) {
          setConnectedUser(undefined);
          onSuccess();
          goSignIn();
        }
      })
      .catch((error: ApiError) => {
        onFailed?.(error.errorCode);
      });
  };

  return {
    signIn,
    connectedUser,
    signUp,
    signOut,
    isWaiting,
  };
};
