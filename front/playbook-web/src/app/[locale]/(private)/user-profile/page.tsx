"use client";

import { PlayText } from "@/components/ui/Text";
import { COMING_FROM } from "@/lib/constants";
import { useUserController } from "@/services/user";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import { AboutSection } from "../profile/components/aboutSection";
import { MainDetails } from "../profile/components/mainDetails";

const UserProfilePage = () => {
  const { getUser } = useUserController();
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const fetchedUser = await getUser(userId);
        if (!fetchedUser) {
          setError("unable-to-load-user");
          return;
        }
        setUser(fetchedUser);
      } catch {
        setError("unable-to-load-user");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
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

  if (!user || error) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center py-8">
        <PlayText.Primary
          content={error || "User profile not found"}
          className="text-center text-lg font-medium text-stone-300"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-start px-4 py-10 text-stone-100 sm:px-6 md:px-16 lg:px-24">
      <style>{`
        @keyframes up-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .up-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="up-anim flex flex-col items-center gap-2 text-center animate-[up-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]">
          <PlayText.Primary
            id="profile"
            className="bg-linear-to-r from-amber-100 via-primary to-amber-100 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
          />
        </div>

        <div className="up-anim relative overflow-hidden rounded-3xl border border-primary/25 bg-secondary/20 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[up-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.1s_backwards]">
          <div
            aria-hidden
            className="h-32 bg-linear-to-r from-primary/70 via-extra/60 to-secondary/70 sm:h-40"
          />

          <div className="-mt-16 flex flex-col items-center gap-4 px-6 pb-8 sm:-mt-20">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/40 blur-2xl"
              />
              <div className="relative rounded-full bg-linear-to-tr from-primary via-amber-200/70 to-extra p-1 shadow-2xl shadow-primary/30">
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-neutral-950 p-1.5 sm:h-44 sm:w-44">
                  {user.avatar ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${user.avatar}`}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-full bg-linear-to-tr from-extra to-primary text-3xl font-extrabold text-white shadow-inner sm:text-4xl`}
                    >
                      {user.firstname.charAt(0).toUpperCase()}
                      {user.lastname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center">
              <PlayText.Primary
                content={`${user.firstname} ${user.lastname}`}
                className="max-w-full truncate text-xl font-bold tracking-tight text-stone-100 sm:text-2xl"
              />
              <PlayText.Primary
                content={`@${user.username}`}
                className="max-w-full truncate text-sm text-amber-200/80"
              />
            </div>

            {(user.followers_count !== undefined ||
              user.following_count !== undefined) && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {user.followers_count !== undefined && (
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-secondary/30 px-5 py-2.5 backdrop-blur-md">
                    <PlayText.Span
                      texts={[
                        {
                          content: user.followers_count?.toString(),
                          className: "font-bold tabular-nums text-amber-200",
                        },
                        {
                          text: "followers",
                          className: "text-xs font-semibold text-stone-300",
                        },
                      ]}
                    />
                  </div>
                )}
                {user.following_count !== undefined && (
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-secondary/30 px-5 py-2.5 backdrop-blur-md">
                    <PlayText.Span
                      texts={[
                        {
                          content: user.following_count?.toString(),
                          className: "font-bold tabular-nums text-amber-200",
                        },
                        {
                          text: "following",
                          className: "text-xs font-semibold text-stone-300",
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start md:gap-8">
          <div className="up-anim animate-[up-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.25s_backwards]">
            <AboutSection comingFrom={COMING_FROM.OTHER} bio={user.bio} />
          </div>

          <div className="up-anim animate-[up-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.35s_backwards]">
            <MainDetails comingFrom={COMING_FROM.OTHER} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
