import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

export const NotificationPopUp: React.FC<{
  unreadCount: number;
  notifications: {
    id: string;
    text: string;
    time: string;
    read: boolean;
  }[];
  onRead: (id: string) => void;
}> = ({ unreadCount, notifications, onRead }) => {
  const t = useTranslations();
  return (
    <div className="np-anim absolute inset-e-0 z-50 mt-3 flex w-[min(20rem,calc(100vw-2rem))] origin-top-right flex-col gap-3 rounded-3xl border border-primary/25 bg-neutral-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-2xl animate-[np-in_0.35s_cubic-bezier(0.22,1,0.36,1)_both] rtl:origin-top-left">
      <style>{`
        @keyframes np-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes np-item-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .np-anim, .np-item { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent"
      />

      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-5 w-1 rounded-full bg-linear-to-b from-primary to-extra"
          />
          <PlayText.Primary
            id="notifications"
            className="text-sm font-bold text-stone-100"
          />
        </div>
        <PlayText.Span
          texts={[
            {
              content: `${unreadCount} ${t("unread")}`,
            },
          ]}
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            unreadCount > 0
              ? "border-primary/50 bg-primary/20 text-amber-200"
              : "border-white/10 bg-white/5 text-stone-400"
          }`}
        />
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pe-1 [scrollbar-color:var(--color-primary)_transparent] scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Image
              alt="bell"
              src={"/icons/bell.png"}
              width={28}
              height={28}
              className="opacity-40"
            />
            <PlayText.Primary
              id="no-notifications"
              className="text-center text-xs text-stone-400"
            />
          </div>
        ) : (
          notifications.map((notif, index) => (
            <button
              key={notif.id}
              onClick={() => {
                onRead(notif.id);
              }}
              style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
              className={`np-item grouprelative flex cursor-pointer items-start gap-3 overflow--hidden rounded-2xl border p-3 text-start transition-all duration-300 animate-[np-item-in_0.4s_cubic-bezier(0.22,1,0.36,1)_both] hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/15 active:translate-y-0 active:scale-[0.98] ${
                notif.read
                  ? "border-white/5 bg-white/5"
                  : "border-primary/40 bg-primary/10 shadow-md shadow-primary/10"
              }`}
            >
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                  notif.read ? "bg-white/15" : "animate-pulse bg-primary"
                }`}
              />

              <span className="flex min-w-0 flex-col gap-1">
                <PlayText.Primary
                  content={notif.text}
                  className={`text-xs leading-snug ${
                    notif.read ? "text-stone-400" : "text-stone-100"
                  }`}
                />
                <PlayText.Span
                  texts={[{ content: notif.time }]}
                  className="text-[10px] text-stone-500"
                />
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
