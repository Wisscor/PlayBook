"use client";

import { PlayText } from "@/components/ui/Text";
import { getCurrentUser } from "@/services/auth";
import { User } from "@/types/user";
import React, { useEffect, useState } from "react";
import { AboutSection } from "./aboutSection";
import { MainDetails } from "./mainDetails";
import { COMING_FROM, ROUTES } from "@/lib/constants";
import { Link } from "../../../../../../i18n/navigation";
import Image from "next/image";

const mocked = {
  id: "888",
  firstname: "last",
  lastname: "cvdf",
  username: "ksksksk",
  email: "xxkxkx",
  bio: "dddi",
  avatar: "ososo",
};

export const ProfilePageContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(mocked);
  const [isLoading, setIsLoading] = useState(true);

  const followerCount = 124;

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((error) => console.error("Unable to load profile:", error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-slate-300">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-center text-lg font-medium text-slate-300"
        />
      </div>
    );
  }

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
          <AboutSection comingFrom={COMING_FROM.ME} bio={user.bio} />

          <div className="order-1 flex flex-col items-center justify-center py-4 md:order-2 md:py-0 gap-4">
            <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl sm:h-48 sm:w-48 md:h-56 md:w-56">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-indigo-950 to-indigo-600 text-3xl font-extrabold text-white shadow-inner sm:text-4xl">
                {user.firstname.charAt(0).toUpperCase()}
                {user.lastname.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={ROUTES.FOLLOWERS}
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
                      content: followerCount.toString(),
                      className: "font-bold text-white",
                    },
                    {
                      text: "followers",
                      className: "text-xs font-semibold text-slate-300",
                    },
                  ]}
                />
              </Link>
              <Link
                href={ROUTES.FOLLOWERS}
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
                      content: followerCount.toString(),
                      className: "font-bold text-white",
                    },
                    {
                      text: "following",
                      className: "text-xs font-semibold text-slate-300",
                    },
                  ]}
                />
              </Link>
            </div>
          </div>

          <MainDetails comingFrom={COMING_FROM.ME} user={user} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePageContent;
