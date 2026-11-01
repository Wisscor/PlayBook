"use client";

import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { COMING_FROM } from "@/lib/constants";
import { useProfileController } from "@/services/profile";
import Image from "next/image";
import React, { useEffect } from "react";
import { AboutSection } from "./components/aboutSection";
import { MainDetails } from "./components/mainDetails";

const ProfilePage = () => {
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
      <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-center text-lg font-medium text-stone-300"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-start px-4 py-10 text-stone-100 sm:px-6 md:px-16 lg:px-24">
      <style>{`
        @keyframes pf-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pf-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pf-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="pf-anim flex flex-col items-center gap-2 text-center animate-[pf-in_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
          <PlayText.Primary
            id="profile"
            className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
          />
        </div>

        <div className="pf-anim relative overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[pf-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
          <div
            aria-hidden
            className="h-32 bg-linear-to-r from-primary/70 via-extra/60 to-secondary/70 sm:h-40"
          />

          <div className="-mt-16 flex flex-col items-center gap-5 px-6 pb-8 sm:-mt-20">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/40 blur-2xl"
              />
              <div className="relative rounded-full bg-linear-to-tr from-primary via-amber-200/70 to-extra p-1 shadow-2xl shadow-primary/30">
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-neutral-950 p-1.5 sm:h-44 sm:w-44">
                  {connectedUser.avatar ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${connectedUser.avatar}`}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr from-extra to-primary text-3xl font-extrabold text-white shadow-inner sm:text-4xl`}
                    >
                      {connectedUser.firstname.charAt(0).toUpperCase()}
                      {connectedUser.lastname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/40 transition-all duration-300 hover:scale-110 hover:shadow-primary/60 active:scale-95 sm:bottom-2 sm:right-2">
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
                  className="flex h-full w-full cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  goFollowers("followers", connectedUser.id);
                }}
                className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-secondary/30 px-5 py-2.5 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-95"
              >
                <Image
                  alt="follower"
                  src={"/icons/add-friend.png"}
                  width={20}
                  height={20}
                  className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                />
                <PlayText.Span
                  texts={[
                    {
                      content: connectedUser.followers_count?.toString(),
                      className: "font-bold tabular-nums text-amber-200",
                    },
                    {
                      text: "followers",
                      className: "text-xs font-semibold text-stone-300",
                    },
                  ]}
                />
              </button>
              <button
                onClick={() => {
                  goFollowers("following", connectedUser.id);
                }}
                className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-secondary/30 px-5 py-2.5 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-95"
              >
                <Image
                  alt="follower"
                  src={"/icons/add-friend.png"}
                  width={20}
                  height={20}
                  className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                />
                <PlayText.Span
                  texts={[
                    {
                      content: connectedUser.following_count?.toString(),
                      className: "font-bold tabular-nums text-amber-200",
                    },
                    {
                      text: "following",
                      className: "text-xs font-semibold text-stone-300",
                    },
                  ]}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8">
          <div className="pf-anim animate-[pf-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.25s_both]">
            <AboutSection comingFrom={COMING_FROM.ME} bio={connectedUser.bio} />
          </div>

          <div className="pf-anim animate-[pf-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.35s_both]">
            <MainDetails comingFrom={COMING_FROM.ME} user={connectedUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
