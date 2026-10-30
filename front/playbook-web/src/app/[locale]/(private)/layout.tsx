"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/lib/constants";
import { useLocale } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "../../../../i18n/navigation";
import { BurgerMenu } from "./components/burgerMenu";
import { NotificationPopUp } from "./notificationPopUp";
import { useAuthController } from "@/services/auth";

const unreadMessages = 3;

export const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuthController();
  const locale = useLocale();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | undefined>(undefined);
  const { goMessages, goSearch } = useNavigation();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Alex Johnson invited you to a basketball match.",
      time: "10m ago",
      read: false,
    },
    {
      id: 2,
      text: "Your match 'Weekend Football' starts tomorrow.",
      time: "1h ago",
      read: false,
    },
    {
      id: 3,
      text: "Sarah Connor liked your post.",
      time: "3h ago",
      read: true,
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menu = [
    {
      name: "my-posts",
      route: ROUTES.POSTS,
    },
    {
      name: "my-matches",
      route: ROUTES.MATCHES,
    },
    {
      name: "my-profile",
      route: ROUTES.PROFILE,
    },
    {
      name: "my-requests",
      route: ROUTES.PLAY_REQUESTS,
    },
  ];

  const handleLogout = () => {
    setIsLoggingOut(true);
    setLogoutError("");
    void signOut(
      () => {
        window.location.reload();
      },
      (error) => {
        setLogoutError(error);
        setIsLoggingOut(false);
      },
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12 lg:px-20">
          <Link href={ROUTES.HOME} className="relative h-8 w-32">
            <Image
              alt="app-logo"
              src="/logos/app-logo.png"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {menu.map((el) => {
              const isActive = pathname.includes(el.route);
              return (
                <Link
                  key={el.name}
                  href={el.route}
                  className={`group relative py-1 transition-colors ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PlayText.Primary
                    id={el.name}
                    className="text-sm lg:text-base font-medium"
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-white shadow-sm shadow-white/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="items-center flex gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => goSearch()}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                aria-label="Search Matches & Community"
              >
                <Image
                  alt="search"
                  src={"/icons/search.png"}
                  width={20}
                  height={20}
                />
              </button>

              <PlayButton.Complexe
                type="button"
                onClick={() => goMessages()}
                className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                aria-label="Messages"
              >
                <Image
                  alt="chat"
                  src={"/icons/chat.png"}
                  width={20}
                  height={20}
                />

                <PlayText.Span
                  texts={[
                    unreadMessages > 0
                      ? {
                          content: unreadMessages.toString(),
                          className:
                            "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md",
                        }
                      : {},
                  ]}
                />
              </PlayButton.Complexe>

              <div className="relative block" ref={notificationRef}>
                <PlayButton.Complexe
                  type="button"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Image
                    alt="bell"
                    src={"/icons/bell.png"}
                    width={20}
                    height={20}
                  />

                  <PlayText.Span
                    texts={[
                      unreadCount > 0
                        ? {
                            content: unreadCount.toString(),
                            className:
                              "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md",
                          }
                        : {},
                    ]}
                  />
                </PlayButton.Complexe>

                {isNotificationsOpen && (
                  <NotificationPopUp
                    setNotifications={setNotifications}
                    notifications={notifications}
                    unreadCount={unreadCount}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed cursor-pointer disabled:opacity-60 lg:block"
              >
                <PlayText.Primary
                  id={isLoggingOut ? "logging-out" : "logout"}
                  className="text-sm font-semibold text-rose-300"
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 lg:hidden"
              aria-label="Toggle menu"
            >
              <Image
                loading="eager"
                alt="menu-icon"
                src="/icons/menu.png"
                width={20}
                height={20}
                className="opacity-80 transition-opacity hover:opacity-100"
              />
            </button>
          </div>

          <BurgerMenu
            close={() => setIsExpanded(false)}
            menu={menu}
            isOpen={isExpanded}
            locale={locale}
            more={
              <div className="grid grid-cols-3 items-center gap-3 ">
                <button
                  type="button"
                  onClick={() => goSearch()}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                  aria-label="Search Matches & Community"
                >
                  <Image
                    alt="search"
                    src={"/icons/search.png"}
                    width={20}
                    height={20}
                  />
                </button>

                <PlayButton.Complexe
                  type="button"
                  onClick={() => goMessages()}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                  aria-label="Messages"
                >
                  <Image
                    alt="chat"
                    src={"/icons/chat.png"}
                    width={20}
                    height={20}
                  />

                  <PlayText.Span
                    texts={[
                      unreadMessages > 0
                        ? {
                            content: unreadMessages.toString(),
                            className:
                              "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md",
                          }
                        : {},
                    ]}
                  />
                </PlayButton.Complexe>

                <div className="relative block" ref={notificationRef}>
                  <PlayButton.Complexe
                    type="button"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 cursor-pointer flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Image
                      alt="bell"
                      src={"/icons/bell.png"}
                      width={20}
                      height={20}
                    />

                    <PlayText.Span
                      texts={[
                        unreadCount > 0
                          ? {
                              content: unreadCount.toString(),
                              className:
                                "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md",
                            }
                          : {},
                      ]}
                    />
                  </PlayButton.Complexe>

                  {isNotificationsOpen && (
                    <NotificationPopUp
                      setNotifications={setNotifications}
                      notifications={notifications}
                      unreadCount={unreadCount}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="hidden rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed cursor-pointer disabled:opacity-60 lg:block"
                >
                  <PlayText.Primary
                    id={isLoggingOut ? "logging-out" : "logout"}
                    className="text-sm font-semibold text-rose-300"
                  />
                </button>
              </div>
            }
          />
        </div>
        {logoutError && (
          <PlayText.Primary
            id={logoutError}
            className="px-6 pb-2 text-right text-sm text-rose-400 md:px-12 lg:px-20"
          />
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-12 lg:px-20">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-6 text-center text-sm text-slate-400">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20 flex items-center justify-center gap-4 flex-col md:flex-row">
          <Link
            href={ROUTES.PRIVACY_POLICY}
            className="rounded-xl p-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <PlayText.Primary id="privacy-policy" />
          </Link>
          <p>
            &copy; {new Date().getFullYear()} playbook. All rights reserved.
          </p>
          <Link
            href={ROUTES.TERMS_OF_SERVICE}
            className="rounded-xl p-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <PlayText.Primary id="terms-of-service" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PrivateLayout;
