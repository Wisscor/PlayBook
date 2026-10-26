import { User } from "@/types/user";
import { api } from "./api";
import { useAuth } from "@/hooks/contexts/authContext";

export const useProfileController = () => {
  const { setConnectedUser } = useAuth();
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
  return {
    updateProfile,
    uploadAvatar,
  };
};
