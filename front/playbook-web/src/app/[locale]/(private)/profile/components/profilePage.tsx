"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { isEmailValid } from "@/lib/utils";
import { api } from "@/services/api";
import { User } from "@/types/user";
import axios from "axios";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Info } from "./info";

type EditableUser = Pick<User, "firstname" | "lastname" | "username" | "email" | "bio">;

const emptyUser: EditableUser = {
  firstname: "",
  lastname: "",
  username: "",
  email: "",
  bio: "",
};

export const ProfilePageContent = () => {
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [updatedInfos, setUpdatedInfos] = useState<EditableUser>(emptyUser);
  const [editing, setEditing] = useState({
    username: false,
    email: false,
    firstname: false,
    lastname: false,
    bio: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get<User>("/users/me");
        const profile = response.data;
        setUser(profile);
        setUpdatedInfos({
          firstname: profile.firstname,
          lastname: profile.lastname,
          username: profile.username,
          email: profile.email ?? "",
          bio: profile.bio ?? "",
        });
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          setError(t("login-to-see"));
        } else {
          setError(t("profile-load-error"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [t]);

  const setField = (field: keyof EditableUser, value: string) => {
    setUpdatedInfos((current) => ({ ...current, [field]: value }));
  };

  const isSomethingChanged =
    user !== null &&
    (updatedInfos.username !== user.username ||
      updatedInfos.firstname !== user.firstname ||
      updatedInfos.lastname !== user.lastname ||
      updatedInfos.email !== (user.email ?? "") ||
      updatedInfos.bio !== (user.bio ?? ""));

  const toggleEditing = (field: keyof typeof editing) => {
    if (editing[field]) {
      const value = updatedInfos[field];
      if (field !== "bio" && value.trim() === "") {
        setError(t("profile-field-required"));
        return;
      }
      if (field === "email" && !isEmailValid(value.trim())) {
        setError(t("profile-email-invalid"));
        return;
      }
    }

    setError(null);
    setEditing((current) => ({ ...current, [field]: !current[field] }));
  };

  const saveProfile = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await api.patch<User>("/users/me", {
        firstname: updatedInfos.firstname,
        lastname: updatedInfos.lastname,
        username: updatedInfos.username,
        email: updatedInfos.email,
        bio: updatedInfos.bio || null,
      });
      setUser(response.data);
      setUpdatedInfos({
        firstname: response.data.firstname,
        lastname: response.data.lastname,
        username: response.data.username,
        email: response.data.email ?? "",
        bio: response.data.bio ?? "",
      });
      setEditing({
        username: false,
        email: false,
        firstname: false,
        lastname: false,
        bio: false,
      });
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const detail = requestError.response?.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          setError(detail[0].msg);
        } else {
          setError(t("profile-update-error"));
        }
      } else {
        setError(t("profile-update-error"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PlayText.Primary content="Loading..." className="text-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <PlayText.Primary
          content={error ?? t("login-to-see")}
          className="text-center text-black"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white100 p-4 py-8 lg:px-30">
      <div className="flex w-full flex-col gap-8 rounded-xl bg-white px-6 py-4 shadow-2xl lg:w-1/2">
        <div className="relative flex flex-col items-center gap-2">
          <div className="absolute h-12 w-full rounded-xl bg-extra" />
          <div className="z-10 mt-4 rounded-full bg-white p-1">
            <div className="flex flex-col items-center gap-4 rounded-full bg-primary p-4">
              <PlayText.Primary
                className="text-xl text-black"
                content={`${user.firstname.charAt(0).toUpperCase()} ${user.lastname.charAt(0).toUpperCase()}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing.username ? (
              <PlayInput.Primary
                onChange={(e) => setField("username", e.target.value)}
                placeholder="username"
                value={updatedInfos.username}
                className="py-2 text-sm text-black"
              />
            ) : (
              <PlayText.Primary className="text-xl text-black" content={updatedInfos.username} />
            )}
            <button onClick={() => toggleEditing("username")} type="button">
              <Image alt="edit" src="/icons/edit.png" width={18} height={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {editing.email ? (
              <PlayInput.Primary
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email"
                type="email"
                value={updatedInfos.email}
                className="py-2 text-sm text-black"
              />
            ) : (
              <PlayText.Primary
                className={`${updatedInfos.email ? "text-gray" : "text-warning"} text-lg`}
                content={updatedInfos.email || t("not-set")}
              />
            )}
            <button onClick={() => toggleEditing("email")} type="button">
              <Image alt="edit" src="/icons/edit.png" width={18} height={18} />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          {(["firstname", "lastname", "bio"] as const).map((field) => (
            <Info
              key={field}
              placeholder={field}
              isEditing={editing[field]}
              updateValue={(value) => setField(field, value)}
              label={`${field}-label`}
              value={updatedInfos[field]}
              onClick={() => toggleEditing(field)}
            />
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-red-700">
          {error}
        </p>
      )}
      {isSomethingChanged && (
        <PlayButton.Primary
          title={isSaving ? "update-infos" : "update-infos"}
          className="w-fit bg-primary px-6 py-4"
          textClassName="text-white"
          onClick={saveProfile}
        />
      )}
    </div>
  );
};
