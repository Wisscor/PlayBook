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
import { useAuthController } from "@/services/auth";
import { useChat } from "@/hooks/contexts/chatContext";
import { useRealtimeController } from "@/services/realtime";
import { NotificationPopUp } from "../notificationPopUp";
import { BurgerMenu } from "../burgerMenu";
import { useDismiss } from "@/hooks/useDismiss";

export const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuthController();
  const locale = useLocale();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | undefined>(undefined);
  const { goMessages, goSearch } = useNavigation();
  const { unreadMessages, notifications } = useChat();
  useDismiss(isExpanded, () => setIsExpanded(false), { outsideClick: false });

  const { markAllNotificationsRead, markNotificationRead } =
    useRealtimeController();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const toggleNotifications = () => {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);
    if (willOpen) {
      void markAllNotificationsRead();
    }
  };
  const notificationItems = notifications.map((notification) => ({
    id: notification.id,
    text: `${notification.actor_username} ${
      {
        follow: "followed you.",
        post_created: "created a new post.",
        play_request: "sent you a play request.",
        play_request_accepted: "accepted your play request.",
        play_request_rejected: "rejected your play request.",
        match_updated: "updated a match you joined.",
        match_cancelled: "cancelled a match you joined.",
      }[notification.event_type] ?? "triggered a notification."
    }`,
    time: new Date(notification.created_at).toLocaleString(),
    read: Boolean(notification.read_at),
  }));

  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inside =
        desktopNotifRef.current?.contains(target) ||
        mobileNotifRef.current?.contains(target);
      if (!inside) setIsNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-neutral-950 text-stone-100 selection:bg-primary/40">
      <style>{`
        @keyframes pl-header-in {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pl-content-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pl-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(30px, -20px, 0) scale(1.08); }
        }
        @keyframes pl-sheen {
          from { background-position: 0% 50%; }
          to   { background-position: 200% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-anim { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="pl-anim absolute -left-40 -top-40 h-112 w-md rounded-full bg-primary/20 blur-3xl animate-[pl-float_14s_ease-in-out_infinite]" />
        <div className="pl-anim absolute -right-40 top-1/3 h-104 w-104 rounded-full bg-extra/20 blur-3xl animate-[pl-float_18s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <header className="pl-anim sticky top-0 z-50 border-b border-primary/20 bg-neutral-950/70 shadow-2xl shadow-black/40 backdrop-blur-xl animate-[pl-header-in_0.6s_cubic-bezier(0.22,1,0.36,1)_backwards]">
        <div
          aria-hidden
          className="pl-anim absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-primary),var(--color-extra),var(--color-primary),transparent)] bg-size-[200%_100%] animate-[pl-sheen_6s_linear_infinite]"
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 md:px-12 lg:px-20">
          <Link
            href={ROUTES.HOME}
            className="relative h-8 w-32 shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Image
              alt="app-logo"
              src="/logos/app-logo.png"
              fill
              sizes="128px"
              className="object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-secondary/30 p-1 backdrop-blur-md lg:flex">
            {menu.map((el) => {
              const isActive = pathname.includes(el.route);
              return (
                <Link
                  key={el.name}
                  href={el.route}
                  className={`group relative rounded-full px-5 py-2 transition-all duration-300 ${
                    isActive
                      ? "bg-linear-to-r from-primary to-extra text-white shadow-lg shadow-primary/30"
                      : "text-stone-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <PlayText.Primary
                    id={el.name}
                    className="text-sm font-medium tracking-wide lg:text-[0.95rem]"
                  />
                  {!isActive && (
                    <span className="absolute inset-x-5 bottom-1 h-px origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => goSearch()}
                className="group flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/30 p-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-95"
                aria-label="Search Matches & Community"
              >
                <Image
                  alt="search"
                  src={"/icons/search.png"}
                  width={20}
                  height={20}
                  className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                />
              </button>

              <PlayButton.Complexe
                type="button"
                onClick={() => goMessages()}
                className="group relative flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/30 p-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-95"
                aria-label="Messages"
              >
                <Image
                  alt="chat"
                  src={"/icons/chat.png"}
                  width={20}
                  height={20}
                  className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                />

                <PlayText.Span
                  texts={[
                    unreadMessages > 0
                      ? {
                          content: unreadMessages.toString(),
                          className:
                            "absolute -top-1.5 -end-1.5 flex min-h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-md shadow-primary/50 ring-2 ring-neutral-950",
                        }
                      : {},
                  ]}
                />
              </PlayButton.Complexe>

              <div className="relative block" ref={mobileNotifRef}>
                <PlayButton.Complexe
                  type="button"
                  onClick={toggleNotifications}
                  className="group relative flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/30 p-2.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-95"
                  aria-label="Notifications"
                >
                  <Image
                    alt="bell"
                    src={"/icons/bell.png"}
                    width={20}
                    height={20}
                    className="opacity-80 transition-all duration-300 group-hover:origin-top group-hover:rotate-12 group-hover:opacity-100"
                  />

                  <PlayText.Span
                    texts={[
                      unreadCount > 0
                        ? {
                            content: unreadCount.toString(),
                            className:
                              "absolute -top-1.5 -end-1.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md shadow-primary/50 ring-2 ring-neutral-950",
                          }
                        : {},
                    ]}
                  />
                </PlayButton.Complexe>

                {isNotificationsOpen && (
                  <NotificationPopUp
                    onRead={markNotificationRead}
                    notifications={notificationItems}
                    unreadCount={unreadCount}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hidden cursor-pointer rounded-xl border border-extra/60 bg-extra/20 px-4 py-2 text-sm font-semibold text-amber-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-extra/40 hover:shadow-lg hover:shadow-extra/30 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 lg:block"
              >
                <PlayText.Primary
                  id={isLoggingOut ? "logging-out" : "logout"}
                  className="text-sm font-semibold text-amber-200"
                />
              </button>
            </div>

            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-xl border p-2.5 backdrop-blur-md transition-all duration-300 active:scale-90 lg:hidden ${
                isExpanded
                  ? "rotate-90 border-primary/60 bg-primary/30"
                  : "border-white/10 bg-secondary/30 hover:bg-primary/20"
              }`}
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
            isOpen={isExpanded}
            locale={locale}
            more={
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => goSearch()}
                  className="group flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/40 p-2.5 backdrop-blur-md transition-all duration-300 hover:border-primary/60 hover:bg-primary/20 active:scale-95"
                  aria-label="Search Matches & Community"
                >
                  <Image
                    alt="search"
                    src={"/icons/search.png"}
                    width={20}
                    height={20}
                    className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                  />
                </button>

                <PlayButton.Complexe
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    goMessages();
                  }}
                  className="group relative flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/40 p-2.5 backdrop-blur-md transition-all duration-300 hover:border-primary/60 hover:bg-primary/20 active:scale-95"
                  aria-label="Messages"
                >
                  <Image
                    alt="chat"
                    src={"/icons/chat.png"}
                    width={20}
                    height={20}
                    className="opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                  />

                  <PlayText.Span
                    texts={[
                      unreadMessages > 0
                        ? {
                            content: unreadMessages.toString(),
                            className:
                              "absolute -top-1.5 -end-1.5 flex min-h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-md shadow-primary/50 ring-2 ring-neutral-950",
                          }
                        : {},
                    ]}
                  />
                </PlayButton.Complexe>

                <div className="relative block" ref={desktopNotifRef}>
                  <PlayButton.Complexe
                    type="button"
                    onClick={toggleNotifications}
                    className="group relative flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-secondary/40 p-2.5 backdrop-blur-md transition-all duration-300 hover:border-primary/60 hover:bg-primary/20 active:scale-95"
                    aria-label="Notifications"
                  >
                    <Image
                      alt="bell"
                      src={"/icons/bell.png"}
                      width={20}
                      height={20}
                      className="opacity-80 transition-all duration-300 group-hover:origin-top group-hover:rotate-12 group-hover:opacity-100"
                    />

                    <PlayText.Span
                      texts={[
                        unreadCount > 0
                          ? {
                              content: unreadCount.toString(),
                              className:
                                "absolute -top-1.5 -end-1.5 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md shadow-primary/50 ring-2 ring-neutral-950",
                            }
                          : {},
                      ]}
                    />
                  </PlayButton.Complexe>

                  {isNotificationsOpen && (
                    <NotificationPopUp
                      onRead={markNotificationRead}
                      notifications={notificationItems}
                      unreadCount={unreadCount}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="hidden cursor-pointer rounded-xl border border-extra/60 bg-extra/20 px-4 py-2 text-sm font-semibold text-amber-200 transition-all duration-300 hover:bg-extra/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlayText.Primary
                    id={isLoggingOut ? "logging-out" : "logout"}
                    className="text-sm font-semibold text-amber-200"
                  />
                </button>
              </div>
            }
          />
        </div>
        {logoutError && (
          <PlayText.Primary
            id={logoutError}
            className="px-6 pb-2 text-end text-sm text-rose-300 md:px-12 lg:px-20"
          />
        )}
      </header>

      <main className="relative z-10 flex-1 pb-24 lg:pb-0">
        <div className="pl-anim mx-auto max-w-7xl px-6 py-10 animate-[pl-content-in_0.7s_cubic-bezier(0.22,1,0.36,1)_0.15s_backwards] md:px-12 lg:px-20">
          {children}
        </div>
      </main>

      <footer className="relative z-10 border-t border-primary/20 bg-neutral-950/70 py-6 text-center text-sm text-stone-400 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-6 md:flex-row md:px-12 lg:px-20">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <span className="bg-linear-to-r from-primary to-extra bg-clip-text font-semibold text-transparent">
              playbook
            </span>
            . All rights reserved.
          </p>
        </div>
      </footer>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/25 bg-neutral-950/85 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black/60 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-secondary/30 p-1">
          {menu.map((el) => {
            const isActive = pathname.includes(el.route);
            return (
              <Link
                key={el.name}
                href={el.route}
                className={`flex items-center justify-center rounded-xl px-1 py-2.5 text-center transition-all duration-300 active:scale-95 ${
                  isActive
                    ? "bg-linear-to-r from-primary to-extra text-white shadow-lg shadow-primary/30"
                    : "text-stone-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <PlayText.Primary
                  id={el.name}
                  className="text-[11px] font-semibold leading-tight sm:text-xs"
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PrivateLayout;
