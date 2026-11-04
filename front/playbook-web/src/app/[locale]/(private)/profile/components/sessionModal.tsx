"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayModal } from "@/components/ui/Modal";
import { PlayText } from "@/components/ui/Text";
import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { useSession } from "@/services/session";
import { Session } from "@/types/api";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import { createPortal } from "react-dom";

const timeAgo = (iso: string, locale: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return rtf.format(0, "second");
};

const getDeviceType = (platform: string | null) => {
  const normalizedPlatform = platform?.toLowerCase() ?? "";
  return /android|ios|iphone|ipad|mobile|tablet/.test(normalizedPlatform)
    ? "mobile"
    : "desktop";
};

const getDeviceName = (session: Session) =>
  [session.browser, session.platform].filter(Boolean).join(" on ") ||
  session.user_agent ||
  "Unknown device";

const DeviceIcon: React.FC<{ type: ReturnType<typeof getDeviceType> }> = ({
  type,
}) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-white"
  >
    {type === "mobile" ? (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2.5" />
        <path d="M11 18h2" />
      </>
    ) : (
      <>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    )}
  </svg>
);

const SessionRow: React.FC<{
  session: Session;
  locale: string;
  index: number;
  isRevoking: boolean;
  onLogout: () => void;
}> = ({ session, locale, index, isRevoking, onLogout }) => {
  const meta = session.ip_address;

  return (
    <li
      style={{ animationDelay: `${index * 70}ms` }}
      className={`ss-anim group relative flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-300 animate-[ss-in_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:flex-row sm:items-center ${
        session.is_current
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-white/10 bg-secondary/20 hover:border-primary/40 hover:bg-primary/10"
      } ${isRevoking ? "opacity-50" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-linear-to-br from-primary to-extra shadow-lg shadow-primary/25">
          <DeviceIcon type={getDeviceType(session.platform)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlayText.Primary
              content={getDeviceName(session)}
              className="truncate text-sm font-bold text-stone-100"
            />
            {session.is_current && (
              <PlayText.Primary
                id="this-device"
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
              />
            )}
          </div>
          {meta && (
            <PlayText.Primary
              content={meta}
              className="mt-0.5 truncate text-xs text-stone-400"
            />
          )}
          <PlayText.Span
            className="mt-1 block text-[11px]"
            texts={[
              { text: "signed-in", className: "text-amber-200/70" },
              {
                content: ` ${timeAgo(session.created_at, locale)}`,
                className: "font-medium text-stone-300",
              },
            ]}
          />
          <PlayText.Span
            className="block text-[11px]"
            texts={[
              { text: "expires", className: "text-amber-200/70" },
              {
                content: ` ${timeAgo(session.expires_at, locale)}`,
                className: "font-medium text-stone-300",
              },
            ]}
          />
        </div>
      </div>

      {!session.is_current && (
        <button
          type="button"
          onClick={onLogout}
          disabled={isRevoking}
          className="shrink-0 cursor-pointer rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/60 hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlayText.Primary
            id={isRevoking ? "logging-out" : "logout"}
            className="text-xs font-semibold text-rose-200"
          />
        </button>
      )}
    </li>
  );
};

export const SessionsModal: React.FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const locale = useLocale();
  const {
    sessions,
    isLoading,
    error,
    revokingId,
    isRevokingAll,
    reload,
    revoke,
    revokeAll,
  } = useSession(isOpen);
  const { setConnectedUser } = useAuth();
  const { goSignIn } = useNavigation();
  const [toLogout, setToLogout] = useState<Session | undefined>(undefined);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  if (!isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes ss-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ss-anim { animation: none !important; }
        }
      `}</style>

      <PlayModal.Primary isOpen={isOpen} close={close} title="sessions">
        <div className="flex flex-col gap-5 pt-1">
          <PlayText.Primary
            id="sessions-description"
            className="text-sm leading-relaxed text-stone-400"
          />

          {sessions.length > 0 && !isLoading && (
            <PlayButton.Secondary
              title="logout-all-sessions"
              onClick={() => setConfirmLogoutAll(true)}
              disabled={isRevokingAll || revokingId !== undefined}
              className="w-full border-rose-500/30 text-rose-200 hover:border-rose-500/60 hover:bg-rose-500/10"
            />
          )}

          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <PlayText.Primary id={error} className="text-sm text-rose-200" />
              <button
                type="button"
                onClick={reload}
                className="cursor-pointer self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-stone-100 transition-colors hover:bg-white/10 sm:self-auto"
              >
                <PlayText.Primary id="retry" />
              </button>
            </div>
          )}

          {isLoading ? (
            <ul className="flex flex-col gap-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  style={{ animationDelay: `${i * 120}ms` }}
                  className="flex animate-pulse items-center gap-4 rounded-2xl border border-white/10 bg-secondary/20 p-4"
                >
                  <div className="h-12 w-12 rounded-xl bg-secondary/50" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-1/2 rounded-full bg-secondary/50" />
                    <div className="h-3 w-1/3 rounded-full bg-secondary/30" />
                  </div>
                </li>
              ))}
            </ul>
          ) : sessions.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-secondary/20 p-8 text-center">
              <PlayText.Primary
                id="no-sessions"
                className="text-sm font-medium text-amber-300"
              />
            </div>
          ) : (
            <ul className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto pe-1">
              {sessions.map((session, i) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  locale={locale}
                  index={i}
                  isRevoking={revokingId === session.id}
                  onLogout={() => setToLogout(session)}
                />
              ))}
            </ul>
          )}
        </div>
      </PlayModal.Primary>

      {toLogout && (
        <PlayModal.Primary
          isOpen
          close={() => setToLogout(undefined)}
          title="logout-session"
        >
          <div className="flex flex-col gap-6 pt-1">
            <div className="flex flex-col gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <PlayText.Primary
                content={getDeviceName(toLogout)}
                className="text-sm font-bold text-rose-100"
              />
              <PlayText.Primary
                id="logout-session-warning"
                className="text-sm leading-relaxed text-rose-100/90"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <PlayButton.Secondary
                title="cancel"
                onClick={() => setToLogout(undefined)}
                className="w-full py-3"
              />
              <PlayButton.Primary
                title="confirm-logout-session"
                onClick={() => {
                  const id = toLogout.id;
                  setToLogout(undefined);
                  revoke(id);
                }}
                className="w-full from-rose-600 to-rose-700 py-3 shadow-rose-600/30 hover:shadow-rose-600/40"
              />
            </div>
          </div>
        </PlayModal.Primary>
      )}

      {confirmLogoutAll && (
        <PlayModal.Primary
          isOpen
          close={() => setConfirmLogoutAll(false)}
          title="logout-all-sessions-title"
        >
          <div className="flex flex-col gap-6 pt-1">
            <PlayText.Primary
              id="logout-all-sessions-warning"
              className="text-sm leading-relaxed text-stone-300"
            />
            {error === "unable-to-logout-all-sessions" && (
              <PlayText.Primary
                id={error}
                className="text-sm text-rose-200"
              />
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <PlayButton.Secondary
                title="cancel"
                onClick={() => setConfirmLogoutAll(false)}
                className="w-full"
              />
              <PlayButton.Primary
                title="confirm-logout-all-sessions"
                onClick={async () => {
                  if (await revokeAll()) {
                    setConnectedUser(undefined);
                    setConfirmLogoutAll(false);
                    goSignIn();
                  }
                }}
                disabled={isRevokingAll}
                className="w-full from-rose-600 to-rose-700 shadow-rose-600/30 hover:shadow-rose-600/40"
              />
            </div>
          </div>
        </PlayModal.Primary>
      )}
    </>,
    document.body,
  );
};
