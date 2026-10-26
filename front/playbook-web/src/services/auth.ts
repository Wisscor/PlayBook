import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { ApiError, SignInData, SignUpData } from "@/types/api";
import { User } from "@/types/user";
import { api } from "./api";

export const useAuthController = () => {
  const { connectedUser, setConnectedUser, isLoading, setIsLoading } =
    useAuth();
  const { goSignIn } = useNavigation();

  const signIn = async (data: SignInData, onError: (msg: string) => void) => {
    setIsLoading(true);
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
        setIsLoading(false);
      });
  };

  const signUp = async (data: SignUpData, onError: (msg: string) => void) => {
    setIsLoading(true);

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
        const apiError = error as ApiError;

        onError(apiError.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const signOut = async (onSuccess: () => void, onFailed?: () => void) => {
    await api
      .post("/auth/logout")
      .then((res) => {
        if (res.status === 200) {
          setConnectedUser(undefined);
          onSuccess();
          goSignIn();
        }
      })
      .catch((error) => {
        console.error("error >>>>", error);
        onFailed?.();
      });
  };

  return {
    signIn,
    connectedUser,
    signUp,
    signOut,
    isLoading,
  };
};
