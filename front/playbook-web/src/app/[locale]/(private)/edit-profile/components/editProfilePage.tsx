"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayLabel } from "@/components/ui/Label";
import { PlayText } from "@/components/ui/Text";
import { isEmailValid } from "@/lib/utils";
import { api } from "@/services/api";
import { User } from "@/types/user";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Info } from "./info";

export const EditProfilePageContent: React.FC = () => {
  const t = useTranslations();

  const [updatedInfos, setUpdatedInfos] = useState({
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

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isSomethingChanged = () => {
    if (!user) return false;
    return (
      updatedInfos.username !== user.username ||
      updatedInfos.firstname !== user.firstname ||
      updatedInfos.lastname !== user.lastname ||
      updatedInfos.email !== (user.email ?? "") ||
      updatedInfos.bio !== (user.bio ?? "")
    );
  };

  const checkIfAnyFieldIsEmptyOrInvalid = (infos: typeof updatedInfos) => {
    if (
      infos.username.trim() === "" ||
      infos.firstname.trim() === "" ||
      infos.lastname.trim() === "" ||
      infos.email.trim() === ""
    ) {
      alert("All fields must be filled.");
      return true;
    }
    if (!isEmailValid(infos.email.trim())) {
      alert("Email Invalid.");
      return true;
    }
    return false;
  };

  useEffect(() => {
    api
      .get<User>("/users/me")
      .then((response) => {
        setUser(response.data);
        setUpdatedInfos({
          username: response.data.username,
          firstname: response.data.firstname,
          lastname: response.data.lastname,
          email: response.data.email ?? "",
          bio: response.data.bio ?? "",
        });
      })
      .catch((requestError) => {
        console.error("Unable to load profile:", requestError);
        setError("Unable to load your profile");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-slate-300">Loading...</div>;
  }

  if (!user) {
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
          <div className="flex flex-col items-center justify-center rounded-full border-4 border-slate-950 bg-white/10 p-5 shadow-xl backdrop-blur-md">
            <PlayText.Primary
              className="text-2xl font-extrabold text-white"
              content={`${user.firstname.charAt(0).toUpperCase()}${user.lastname.charAt(0).toUpperCase()}`}
            />
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
                    value={updatedInfos.username}
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
                if (editing.username && updatedInfos.username.trim() === "") {
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
                    value={updatedInfos.email}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-md focus:border-white/30 focus:outline-none"
                  />
                </PlayLabel.Primary>
              ) : (
                <PlayText.Primary
                  className={`text-xs sm:text-sm font-medium truncate ${
                    updatedInfos.email.length !== 0
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
                  if (updatedInfos.email.trim() === "") {
                    alert("Email cannot be empty.");
                    return;
                  }
                  if (!isEmailValid(updatedInfos.email.trim())) {
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
            placeholder="firstname"
            isEditing={editing.firstname}
            updateValue={(v) =>
              setUpdatedInfos({ ...updatedInfos, firstname: v })
            }
            label="firstname-label"
            value={updatedInfos.firstname}
            onClick={() => {
              if (editing.firstname && updatedInfos.firstname.trim() === "") {
                alert("Firstname cannot be empty.");
                return;
              }
              setEditing({ ...editing, firstname: !editing.firstname });
            }}
          />
          <Info
            placeholder="lastname"
            isEditing={editing.lastname}
            updateValue={(v) =>
              setUpdatedInfos({ ...updatedInfos, lastname: v })
            }
            label="lastname-label"
            value={updatedInfos.lastname}
            onClick={() => {
              if (editing.lastname && updatedInfos.lastname.trim() === "") {
                alert("Lastname cannot be empty.");
                return;
              }
              setEditing({ ...editing, lastname: !editing.lastname });
            }}
          />
          <Info
            placeholder="bio"
            isEditing={editing.bio}
            updateValue={(v) => setUpdatedInfos({ ...updatedInfos, bio: v })}
            label="bio-label"
            value={updatedInfos.bio}
            onClick={() => setEditing({ ...editing, bio: !editing.bio })}
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

              api
                .patch<User>("/users/me", updatedInfos)
                .then((response) => {
                  setUser(response.data);
                  setEditing({
                    username: false,
                    email: false,
                    firstname: false,
                    lastname: false,
                    bio: false,
                  });
                })
                .catch((requestError) => {
                  console.error("Unable to update profile:", requestError);
                  setError("Unable to update your profile");
                });
            }}
          />
        </div>
      )}
    </div>
  );
};
