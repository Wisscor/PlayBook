import { User } from "@/types/user";
import { api } from "./api";
import { useAuth } from "@/hooks/contexts/authContext";
import { ApiError } from "@/types/api";

export const useProfileController = () => {
  const { setConnectedUser, setIsLoading } = useAuth();

  const updateProfile = async (
    updatedInfos: User,
    onSuccess: (newUser: User) => void,
    onError: (errorCode?: string) => void,
  ) => {
    await api
      .patch<User>("/users/me", updatedInfos)
      .then((response) => {
        if (response.status == 200) {
          onSuccess(response.data);
        }
      })
      .catch((requestError: ApiError) => {
        onError(requestError.errorCode);
      });
  };

  const uploadAvatar = async (
    file: File,
    onError: (errorCode: string) => void,
  ): Promise<void> => {
    const formData = new FormData();

    formData.append("file", file);

    await api
      .post("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        if (res.status == 200) {
          setConnectedUser(res.data);
        }
      })
      .catch((error: ApiError) => {
        onError(error.errorCode || "PAYLOAD_TOO_LARGE");
      });
  };
  const fetchUser = async (onSuccess?: () => void) => {
    setIsLoading(true);
    await api
      .get<User>("/users/me")
      .then((res) => {
        setConnectedUser(res.data);
        onSuccess?.();
      })
      .catch(() => {
        setConnectedUser(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const deleteUser = async () => {
    await api
      .delete("/users/me")
      .then((res) => {
        if (res.status === 204) {
          setConnectedUser(undefined);
          window.location.reload();
        }
      })
      .catch(() => {});
  };

  return {
    updateProfile,
    uploadAvatar,
    fetchUser,
    deleteUser,
  };
};
