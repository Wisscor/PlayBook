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

const EditProfilePage = () => {
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

  const [error, setError] = useState<string | undefined>(undefined);

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
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center">
        <PlayText.Primary
          id="loading"
          className="animate-pulse text-center text-stone-300"
        />
      </div>
    );
  }

  if (!connectedUser) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center gap-3 py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-lg font-medium text-stone-300 text-center"
        />
        {error && (
          <PlayText.Primary id={error} className="text-sm text-rose-300" />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-start px-4 py-8 text-stone-100 sm:px-8 sm:py-12">
      <style>{`
        @keyframes ep-in {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ep-save-in {
          from { opacity: 0; transform: translateY(24px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ep-glow {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 55%, transparent); }
          50%      { box-shadow: 0 0 0 12px color-mix(in srgb, var(--color-primary) 0%, transparent); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ep-anim { animation: none !important; }
        }
      `}</style>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr] lg:gap-8">
        <div className="ep-anim relative flex flex-col items-center gap-5 self-start overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 px-6 pb-8 pt-16 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[ep-in_0.7s_cubic-bezier(0.22,1,0.36,1)_backwards] lg:sticky lg:top-24">
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-primary/70 via-extra/60 to-secondary/70" />

          <div className="relative z-10 mt-2">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/40 blur-2xl"
            />
            <div className="relative flex h-36 w-36 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full border-4 border-neutral-950 bg-linear-to-tr from-extra to-primary shadow-xl shadow-primary/30">
              {connectedUser.avatar ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${connectedUser.avatar}`}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <PlayText.Primary
                  className="text-3xl font-extrabold text-white"
                  content={`${connectedUser.firstname?.charAt(0).toUpperCase()}${connectedUser.lastname?.charAt(0).toUpperCase()}`}
                />
              )}
            </div>
          </div>

          <div className="relative z-10 flex w-full flex-col gap-3">
            <div className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-2.5">
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
                      className="w-full rounded-xl px-3 py-1.5 text-sm"
                    />
                  </PlayLabel.Primary>
                ) : (
                  <PlayText.Primary
                    className="text-lg font-bold text-stone-100 tracking-tight truncate"
                    content={`@${updatedInfos.username}`}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    editing.username &&
                    updatedInfos.username?.trim() === ""
                  ) {
                    alert("Username cannot be empty.");
                    return;
                  }
                  setEditing({ ...editing, username: !editing.username });
                }}
                className={`group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 active:translate-y-0 active:scale-90 ${
                  editing.username
                    ? "border-primary bg-primary/30 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-secondary/30"
                }`}
              >
                <Image
                  alt="edit"
                  src="/icons/edit.png"
                  width={16}
                  height={16}
                  className="opacity-80 invert shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100"
                />
              </button>
            </div>

            <div className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-2.5">
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
                      className="w-full rounded-xl px-3 py-1.5 text-sm"
                    />
                  </PlayLabel.Primary>
                ) : (
                  <PlayText.Primary
                    className={`text-sm font-medium truncate ${
                      updatedInfos.email?.length !== 0
                        ? "text-stone-300"
                        : "text-amber-300"
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
                className={`group flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 active:translate-y-0 active:scale-90 ${
                  editing.email
                    ? "border-primary bg-primary/30 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-secondary/30"
                }`}
              >
                <Image
                  alt="edit"
                  src="/icons/edit.png"
                  width={16}
                  height={16}
                  className="opacity-80 invert shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="ep-anim flex flex-col gap-6 rounded-3xl border border-white/10 bg-secondary/20 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[ep-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.12s_backwards] sm:p-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span
              aria-hidden
              className="h-6 w-1 rounded-full bg-linear-to-b from-primary to-extra"
            />
            <PlayText.Primary
              id="details"
              className="text-lg font-bold tracking-wide text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Info
              isEditing={editing.firstname}
              label="firstname-label"
              value={updatedInfos.firstname}
              onClick={() => {
                if (
                  editing.firstname &&
                  updatedInfos.firstname?.trim() === ""
                ) {
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
                  className="w-full rounded-xl px-3.5 py-2 text-sm"
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
                    setUpdatedInfos({
                      ...updatedInfos,
                      lastname: e.target.value,
                    })
                  }
                  placeholder={"lastname"}
                  value={updatedInfos.lastname ?? ""}
                  className="w-full rounded-xl px-3.5 py-2 text-sm"
                />
              }
            />
          </div>

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
                className="w-full rounded-xl px-3.5 py-2 text-sm"
              />
            }
          />
        </div>
      </div>

      {isSomethingChanged() && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center lg:bottom-6">
          <div className="ep-anim pointer-events-auto rounded-2xl animate-[ep-save-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards,ep-glow_2.4s_ease-in-out_0.6s_infinite]">
            <PlayButton.Primary
              title="update-infos"
              className="px-8 py-3.5"
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
                  (error) => {
                    setError(error);
                  },
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;
