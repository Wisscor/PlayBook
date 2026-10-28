"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { COMING_FROM } from "@/lib/constants";
import { colorRandomizer } from "@/lib/utils";
import { useProfileController } from "@/services/profile";
import { User } from "@/types/user";
import Image from "next/image";
import React, { useEffect } from "react";
import { AboutSection } from "./components/aboutSection";
import { MainDetails } from "./components/mainDetails";

const mocked: User = {
  id: "888",
  firstname: "last",
  lastname: "cvdf",
  username: "ksksksk",
  email: "xxkxkx",
  bio: "dddi",
  avatar: "ososo",
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
};

export const ProfilePage = () => {
  const { connectedUser, isLoading, setIsLoading } = useAuth();
  const { goFollowers } = useNavigation();
  const { uploadAvatar, fetchUser } = useProfileController();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setIsLoading(true);

      await uploadAvatar(file);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setIsLoading(false);

      event.target.value = "";
    }
  };

  useEffect(() => {
    void fetchUser(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-slate-300">Loading...</div>;
  }

  if (!connectedUser) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-center text-lg font-medium text-slate-300"
        />
      </div>
    );
  }

  const fromColor = colorRandomizer();
  const toColor = colorRandomizer();

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-start bg-slate-950 px-4 py-12 text-white sm:px-6 md:px-16 lg:px-24">
      <div className="flex w-full max-w-5xl flex-col gap-8 md:gap-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <PlayText.Primary
            id="profile"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          />
        </div>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-8">
          <AboutSection comingFrom={COMING_FROM.ME} bio={connectedUser.bio} />

          <div className="order-1 flex flex-col items-center justify-center py-4 md:order-2 md:py-0 gap-4">
            <div className="relative flex h-40 w-40 items-center justify-center overflow--hidden rounded-full border-4 border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl sm:h-48 sm:w-48 md:h-56 md:w-56">
              {connectedUser.avatar ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${connectedUser.avatar}`}
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  style={{
                    backgroundImage: `linear-gradient(to right, ${fromColor}, ${toColor})`,
                  }}
                  className={`flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr  text-3xl font-extrabold text-white shadow-inner sm:text-4xl`}
                >
                  {connectedUser.firstname.charAt(0).toUpperCase()}
                  {connectedUser.lastname.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full cursor-pointer bg-white/10 p-1 text-white transition-all hover:bg-white/20">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={handleButtonClick}
                  disabled={isLoading}
                >
                  <Image
                    alt="upload"
                    src={"/icons/upload.png"}
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  goFollowers("followers", connectedUser.id);
                }}
                className="group flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2  backdrop-blur-md transition-all hover:bg-white/10 hover:text-white shadow-md cursor-pointer"
              >
                <Image
                  alt="follower"
                  src={"/icons/add-friend.png"}
                  width={20}
                  height={20}
                />
                <PlayText.Span
                  texts={[
                    {
                      content: connectedUser.followers_count?.toString(),
                      className: "font-bold text-white",
                    },
                    {
                      text: "followers",
                      className: "text-xs font-semibold text-slate-300",
                    },
                  ]}
                />
              </button>
              <button
                onClick={() => {
                  goFollowers("following", connectedUser.id);
                }}
                className="group flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2  backdrop-blur-md transition-all hover:bg-white/10 hover:text-white shadow-md cursor-pointer"
              >
                <Image
                  alt="follower"
                  src={"/icons/add-friend.png"}
                  width={20}
                  height={20}
                />
                <PlayText.Span
                  texts={[
                    {
                      content: connectedUser.following_count?.toString(),
                      className: "font-bold text-white",
                    },
                    {
                      text: "following",
                      className: "text-xs font-semibold text-slate-300",
                    },
                  ]}
                />
              </button>
            </div>
          </div>

          <MainDetails comingFrom={COMING_FROM.ME} user={connectedUser} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
