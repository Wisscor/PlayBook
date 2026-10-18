"use client";

import { PlayText } from "@/components/ui/Text";
import { User } from "@/types/user";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import React from "react";
import { AboutSection } from "./aboutSection";
import { MainDetails } from "./mainDetails";

export const ProfilePageContent: React.FC<{
  sessionCookie?: RequestCookie;
}> = ({ sessionCookie }) => {
  let user: User = {
    firstname: "Wissam",
    lastname: "Azadou",
    username: "wazadou",
    email: "",
    bio: "",
  };

  if (sessionCookie?.value) {
    try {
      user = { ...user, ...JSON.parse(sessionCookie.value) };
    } catch (error) {
      console.error("Malformed session data:", error);
    }
  }

  if (!sessionCookie?.value) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-140px)] justify-center items-center py-8">
        <PlayText.Primary
          id="login-to-see"
          className="text-lg font-medium text-slate-300 text-center"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-950 px-4 sm:px-6 md:px-16 lg:px-24 py-12 justify-start items-center text-white">
      <div className="w-full max-w-5xl flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col items-center text-center gap-2">
          <PlayText.Primary
            id="profile"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
          <AboutSection bio={user.bio} />

          <div className="order-1 md:order-2 flex flex-col items-center justify-center py-4 md:py-0">
            <div className="relative flex items-center justify-center h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 rounded-full border-4 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 text-3xl sm:text-4xl font-extrabold text-white shadow-inner">
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
