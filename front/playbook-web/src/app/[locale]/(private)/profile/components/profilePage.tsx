"use client";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Info } from "./info";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { User } from "@/types/user";
import { isEmailValid } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { PlayerButton } from "@/components/ui/Button";
import Cookies from "js-cookie";

export const ProfilePageContent: React.FC<{
  sessionCookie: RequestCookie | undefined;
}> = ({ sessionCookie }) => {
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

  let user: User | null = null;

  if (sessionCookie?.value) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (error) {
      console.error("Malformed user session data:", error);
    }
  }

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

  useEffect(() => {
    if (user?.username) {
      setUpdatedInfos({
        ...updatedInfos,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user?.username]);

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-black text-center align-middle"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-white100 p-4 lg:px-30 justify-center items-center py-8 gap-4">
      <div className="flex flex-col gap-8 bg-white rounded-xl shadow-2xl w-full lg:w-1/2 px-6 py-4 ">
        <div className="flex flex-col gap-2 items-center relative ">
          <div className="bg-extra rounded-xl h-12 absolute w-full " />
          <div className="mt-4 bg-white rounded-full p-1 z-10">
            <div className="flex flex-col items-center gap-4 rounded-full bg-primary p-4  ">
              <PlayText.Primary
                className="text-black text-xl"
                content={`${user.firstname.charAt(0).toUpperCase()}  ${user.lastname.charAt(0).toUpperCase()}`}
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {editing.username ? (
              <PlayInput.Primary
                onChange={(e) => {
                  setUpdatedInfos({
                    ...updatedInfos,
                    username: e.target.value,
                  });
                }}
                placeholder="username"
                value={updatedInfos.username}
                className=" py-2 bg-gray text-sm "
              />
            ) : (
              <PlayText.Primary
                className="text-black text-xl"
                content={`${updatedInfos.username}`}
              />
            )}

            <button
              onClick={() => {
                if (editing.username) {
                  if (updatedInfos.username.trim() === "") {
                    alert("Username cannot be empty.");
                    return;
                  }
                }
                setEditing({ ...editing, username: !editing.username });
              }}
            >
              <Image
                alt="edit"
                src={"/icons/edit.png"}
                width={18}
                height={18}
              />
            </button>
          </div>

          <div className="flex gap-2 items-center">
            {editing.email ? (
              <PlayInput.Primary
                onChange={(e) => {
                  setUpdatedInfos({
                    ...updatedInfos,
                    email: e.target.value,
                  });
                }}
                placeholder="email"
                value={updatedInfos.email}
                className=" py-2 bg-gray text-sm "
              />
            ) : (
              <PlayText.Primary
                className={`${updatedInfos.email.length != 0 ? "text-gray" : "text-warning"} text-lg`}
                content={`${updatedInfos.email ? updatedInfos.email : t("not-set")}`}
              />
            )}
            <button
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
            >
              <Image
                alt="edit"
                src={"/icons/edit.png"}
                width={18}
                height={18}
              />
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Info
            placeholder="firstname"
            isEditing={editing.firstname}
            updateValue={(v) => {
              setUpdatedInfos({
                ...updatedInfos,
                firstname: v,
              });
            }}
            label="firstname-label"
            value={updatedInfos.firstname}
            onClick={() => {
              if (editing.firstname) {
                if (updatedInfos.firstname.trim() === "") {
                  alert("Firstname cannot be empty.");
                  return;
                }
              }
              setEditing({ ...editing, firstname: !editing.firstname });
            }}
          />
          <Info
            placeholder="lastname"
            isEditing={editing.lastname}
            updateValue={(v) => {
              setUpdatedInfos({
                ...updatedInfos,
                lastname: v,
              });
            }}
            label="lastname-label"
            value={updatedInfos.lastname}
            onClick={() => {
              if (editing.lastname) {
                if (updatedInfos.lastname.trim() === "") {
                  alert("Lastname cannot be empty.");
                  return;
                }
              }
              setEditing({ ...editing, lastname: !editing.lastname });
            }}
          />
          <Info
            placeholder="bio"
            isEditing={editing.bio}
            updateValue={(v) => {
              setUpdatedInfos({
                ...updatedInfos,
                bio: v,
              });
            }}
            label="bio-label"
            value={updatedInfos.bio}
            onClick={() => {
              setEditing({ ...editing, bio: !editing.bio });
            }}
          />
        </div>
      </div>
      {isSomethingChanged() && (
        <PlayerButton.Primary
          title="update-infos"
          className="w-fit px-6 py-4 bg-primary"
          textClassName="text-white"
          onClick={() => {
            Cookies.set("user_session", JSON.stringify(updatedInfos), {
              expires: 2 / 24,
              secure: true,
              sameSite: "strict",
            });

            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
