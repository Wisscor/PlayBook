import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
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
    <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl p-4 flex flex-col gap-3 z-50">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <PlayText.Primary
          id="notifications"
          className="font-bold text-sm text-white"
        />
        <PlayText.Span
          texts={[
            {
              content: `${unreadCount} ${t("unread")}`,
            },
          ]}
          className="text-[11px] text-slate-400 font-medium"
        />
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <PlayText.Primary
            id="no-notifications"
            className="text-xs text-slate-400 text-center py-4"
          />
        ) : (
          notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                void onRead(notif.id);
              }}
              className={`rounded-2xl border p-3 flex flex-col gap-1 transition-all cursor-pointer ${
                notif.read
                  ? "border-white/5 bg-white/5 text-slate-400"
                  : "border-white/15 bg-white/10 text-slate-200"
              }`}
            >
              <PlayText.Primary
                content={notif.text}
                className="text-xs leading-snug"
              />
              <PlayText.Span
                texts={[{ content: notif.time }]}
                className="text-[10px] text-slate-500"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
};
