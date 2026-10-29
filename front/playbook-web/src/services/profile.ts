import { User } from "@/types/user";
import { api } from "./api";
import { useAuth } from "@/hooks/contexts/authContext";

export const useProfileController = () => {
  const { setConnectedUser, setIsLoading } = useAuth();

  const updateProfile = async (
    updatedInfos: User,
    onSuccess: (newUser: User) => void,
    onError: () => void,
  ) => {
    await api
      .patch<User>("/users/me", updatedInfos)
      .then((response) => {
        if (response.status == 200) {
          onSuccess(response.data);
        }
      })
      .catch((requestError) => {
        onError();
        console.error("Unable to update profile:", requestError);
      });
  };

  const uploadAvatar = async (file: File): Promise<void> => {
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
      .catch((error) => {
        console.error("error loadin user >>>", error);

        setConnectedUser(undefined);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const deleteUser = async () => {
    await api.delete("/users/me").then((res) => {
      if (res.status === 204) {
        setConnectedUser(undefined);
        window.location.reload();
      }
    });
  };

  return {
    updateProfile,
    uploadAvatar,
    fetchUser,
    deleteUser,
  };
};
