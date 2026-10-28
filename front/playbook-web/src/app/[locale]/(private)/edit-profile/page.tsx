"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { isEmailValid } from "@/lib/utils";
import { useProfileController } from "@/services/profile";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Info } from "./components/info";

export const EditProfilePage = () => {
  const t = useTranslations();
  const { connectedUser, setConnectedUser, isLoading } = useAuth();
  const { updateProfile, fetchUser } = useProfileController();

  const [updatedInfos, setUpdatedInfos] = useState<User>({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    bio: "",
  });
  const [editing, setEditing] = useState({
    username: false,
    email: false,
    firstname: false,
    lastname: false,
    bio: false,
  });

  const [error, setError] = useState("");

  const isSomethingChanged = () => {
    if (!connectedUser) return false;
    return (
      updatedInfos.username !== connectedUser.username ||
      updatedInfos.firstname !== connectedUser.firstname ||
      updatedInfos.lastname !== connectedUser.lastname ||
      updatedInfos.email !== (connectedUser.email ?? "") ||
      updatedInfos.bio !== (connectedUser.bio ?? "")
    );
  };

  const checkIfAnyFieldIsEmptyOrInvalid = (infos: typeof updatedInfos) => {
    if (
      infos.username?.trim() === "" ||
      infos.firstname?.trim() === "" ||
      infos.lastname?.trim() === "" ||
      infos.email?.trim() === ""
    ) {
      alert("All fields must be filled.");
      return true;
    }
    if (!isEmailValid(infos.email?.trim() ?? "")) {
      alert("Email Invalid.");
      return true;
    }
    return false;
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  useEffect(() => {
    if (!connectedUser) return;

    setUpdatedInfos({
      username: connectedUser.username,
      firstname: connectedUser.firstname,
      lastname: connectedUser.lastname,
      email: connectedUser.email ?? "",
      bio: connectedUser.bio ?? "",
    });
  }, [connectedUser]);

  if (isLoading) {
    return <div className="py-12 text-center text-slate-300">Loading...</div>;
  }

  if (!connectedUser) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-lg font-medium text-slate-300 text-center"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 p-4 sm:p-8 lg:px-30 justify-center items-center py-8 sm:py-12 gap-8 text-white">
      <div className="relative flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl w-full max-w-2xl px-4 sm:px-10 py-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-r from-secondary/40 via-extra/30 to-primary/40 backdrop-blur-md" />

        <div className="relative z-10 flex flex-col gap-4 items-center pt-8">
          <div className="flex h-36 w-36 shrink--0 overflow-hidden flex-col items-center justify-center rounded-full border-4 border-slate-950 bg-white/10 p--5 shadow-xl backdrop-blur-md">
            {connectedUser.avatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${connectedUser.avatar}`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <PlayText.Primary
                className="text-2xl font-extrabold text-white"
                content={`${connectedUser.firstname?.charAt(0).toUpperCase()}${connectedUser.lastname?.charAt(0).toUpperCase()}`}
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5 w-full max-w-xs">
            <div className="flex-1 min-w-0 text-center">
              {editing.username ? (
                <PlayLabel.Primary>
                  <PlayInput.Primary
                    onChange={(e) =>
                      setUpdatedInfos({
                        ...updatedInfos,
                        username: e.target.value,
                      })
                    }
                    placeholder="username"
                    value={updatedInfos.username ?? ""}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-md focus:border-white/30 focus:outline-none"
                  />
                </PlayLabel.Primary>
              ) : (
                <PlayText.Primary
                  className="text-lg sm:text-xl font-bold text-white tracking-tight truncate"
                  content={`@${updatedInfos.username}`}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (editing.username && updatedInfos.username?.trim() === "") {
                  alert("Username cannot be empty.");
                  return;
                }
                setEditing({ ...editing, username: !editing.username });
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <Image
                alt="edit"
                src="/icons/edit.png"
                width={16}
                height={16}
                className="opacity-80 invert shrink-0"
              />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2.5 w-full max-w-xs">
            <div className="flex-1 min-w-0 text-center">
              {editing.email ? (
                <PlayLabel.Primary>
                  <PlayInput.Primary
                    onChange={(e) =>
                      setUpdatedInfos({
                        ...updatedInfos,
                        email: e.target.value,
                      })
                    }
                    placeholder="email"
                    value={updatedInfos.email ?? ""}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-md focus:border-white/30 focus:outline-none"
                  />
                </PlayLabel.Primary>
              ) : (
                <PlayText.Primary
                  className={`text-xs sm:text-sm font-medium truncate ${
                    updatedInfos.email?.length !== 0
                      ? "text-slate-300"
                      : "text-amber-400"
                  }`}
                  content={
                    updatedInfos.email ? updatedInfos.email : t("not-set")
                  }
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (editing.email) {
                  if (updatedInfos.email?.trim() === "") {
                    alert("Email cannot be empty.");
                    return;
                  }
                  if (!isEmailValid(updatedInfos.email?.trim() ?? "")) {
                    alert("Email Invalid.");
                    return;
                  }
                }
                setEditing({ ...editing, email: !editing.email });
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <Image
                alt="edit"
                src="/icons/edit.png"
                width={16}
                height={16}
                className="opacity-80 invert shrink-0"
              />
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full flex flex-col gap-4 pt-4 border-t border-white/10">
          <Info
            isEditing={editing.firstname}
            label="firstname-label"
            value={updatedInfos.firstname}
            onClick={() => {
              if (editing.firstname && updatedInfos.firstname?.trim() === "") {
                alert("Firstname cannot be empty.");
                return;
              }
              setEditing({ ...editing, firstname: !editing.firstname });
            }}
            input={
              <PlayInput.Primary
                onChange={(e) =>
                  setUpdatedInfos({
                    ...updatedInfos,
                    firstname: e.target.value,
                  })
                }
                placeholder={"firstname"}
                value={updatedInfos.firstname ?? ""}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none"
              />
            }
          />
          <Info
            isEditing={editing.lastname}
            label="lastname-label"
            value={updatedInfos.lastname}
            onClick={() => {
              if (editing.lastname && updatedInfos.lastname?.trim() === "") {
                alert("Lastname cannot be empty.");
                return;
              }
              setEditing({ ...editing, lastname: !editing.lastname });
            }}
            input={
              <PlayInput.Primary
                onChange={(e) =>
                  setUpdatedInfos({ ...updatedInfos, lastname: e.target.value })
                }
                placeholder={"lastname"}
                value={updatedInfos.lastname ?? ""}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none"
              />
            }
          />
          <Info
            isEditing={editing.bio}
            label="bio-label"
            value={updatedInfos.bio}
            onClick={() => setEditing({ ...editing, bio: !editing.bio })}
            input={
              <PlayInput.Area
                onChange={(e) =>
                  setUpdatedInfos({ ...updatedInfos, bio: e.target.value })
                }
                placeholder={"bio"}
                value={updatedInfos.bio ?? ""}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none"
              />
            }
          />
        </div>
      </div>

      {isSomethingChanged() && (
        <div className="fixed bottom-6 z-40 animate-bounce">
          <PlayButton.Primary
            title="update-infos"
            className="rounded-2xl bg-white px-8 py-3.5 shadow-2xl shadow-white/20 hover:bg-slate-100 transition-all font-semibold text-slate-950 cursor-pointer"
            onClick={() => {
              if (checkIfAnyFieldIsEmptyOrInvalid(updatedInfos)) {
                return;
              }

              void updateProfile(
                updatedInfos,
                (newUser) => {
                  setConnectedUser(newUser);
                  setEditing({
                    username: false,
                    email: false,
                    firstname: false,
                    lastname: false,
                    bio: false,
                  });
                },
                () => {
                  setError("Unable to update your profile");
                },
              );
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;
