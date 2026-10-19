"use client";

import { PlayText } from "@/components/ui/Text";
import { getCurrentUser } from "@/services/auth";
import { User } from "@/types/user";
import React, { useEffect, useState } from "react";
import { AboutSection } from "./aboutSection";
import { MainDetails } from "./mainDetails";

export const ProfilePageContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          <AboutSection bio={user.bio} />
          <div className="order-1 flex flex-col items-center justify-center py-4 md:order-2 md:py-0">
            <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl sm:h-48 sm:w-48 md:h-56 md:w-56">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 text-3xl font-extrabold text-white shadow-inner sm:text-4xl">
                {user.firstname.charAt(0).toUpperCase()}
                {user.lastname.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <MainDetails user={user} />
        </div>
      </div>
    </div>
  );
};
