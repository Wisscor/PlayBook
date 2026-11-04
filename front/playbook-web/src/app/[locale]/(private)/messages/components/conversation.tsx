import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { Contact } from "@/types/api";
import { useChat } from "@/hooks/contexts/chatContext";
import React, { useEffect, useRef } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { useTranslations } from "next-intl";

export const Conversation: React.FC<{
  activeContact: Contact;
  handleSendMessage: (e: React.SubmitEvent<Element>) => void;
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
}> = ({ activeContact, handleSendMessage, messageInput, setMessageInput }) => {
  const { timeoutRemaining } = useChat();
  const { goUserProfile } = useNavigation();
  const t = useTranslations();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [activeContact.id, activeContact.messages]);

  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden">
      <style>{`
        @keyframes cv-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cv-anim { animation: none !important; }
        }
      `}</style>

      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-neutral-950/30 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => goUserProfile(activeContact.profileId)}
          aria-label={`View ${activeContact.name}'s profile`}
          className="relative shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-linear-to-tr from-extra to-primary text-sm font-bold text-white shadow-md ring-2 ring-white/10 transition-all duration-300 hover:ring-primary/60">
            {activeContact.avatarUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:8443"}/${activeContact.avatarUrl}`}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              activeContact.avatar
            )}
          </div>
          <span
            aria-label={activeContact.online ? "Online" : "Offline"}
            className={`absolute bottom-0 inset-e-0 h-3 w-3 rounded-full border-2 border-neutral-950 ${
              activeContact.online ? "bg-emerald-400" : "bg-stone-500"
            }`}
          >
            {activeContact.online && (
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60"
              />
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => goUserProfile(activeContact.profileId)}
          className="min-w-0 cursor-pointer rounded text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <PlayText.Primary
            content={activeContact.name}
            className="truncate text-sm font-bold text-stone-100 transition-colors duration-300 hover:text-amber-100"
          />
          <PlayText.Primary
            id={activeContact.online ? "active-now" : "offline"}
            className={`text-[11px] ${
              activeContact.online ? "text-emerald-300" : "text-stone-400"
            }`}
          />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-6 [scrollbar-color:var(--color-primary)_transparent] scrollbar-thin"
      >
        {activeContact.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div
              key={msg.id}
              className={`cv-anim flex max-w-[80%] flex-col animate-[cv-pop_0.3s_cubic-bezier(0.22,1,0.36,1)_backwards] sm:max-w-[70%] ${
                isMe ? "ms-auto items-end" : "me-auto items-start"
              }`}
            >
              <div
                className={`wrap-break-word rounded-2xl w-full px-4 py-2.5 text-sm shadow-md backdrop-blur-md ${
                  isMe
                    ? "rounded-ee-sm bg-linear-to-br from-primary to-extra font-medium text-white shadow-primary/20"
                    : "rounded-es-sm border border-white/10 bg-secondary/40 text-stone-100"
                }`}
              >
                {msg.text}
              </div>
              <div className="mt-1 flex items-center gap-1.5 px-1">
                <PlayText.Span
                  texts={[{ content: msg.time }]}
                  className="text-[10px] tabular-nums text-stone-400"
                />
                {isMe && msg.seen && (
                  <>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-amber-200"
                    >
                      <path d="M2 12l5 5L17 7" />
                      <path d="M12 15l2 2L22 7" />
                    </svg>
                    <PlayText.Primary
                      id="seen"
                      className="text-[10px] text-amber-200/80"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {timeoutRemaining > 0 && (
        <output className="mx-4 mb-3 shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300 sm:mx-6">
          {t("chat-rate-limit-warning", { seconds: timeoutRemaining })}
        </output>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-neutral-950/30 px-4 py-3.5 sm:px-6"
      >
        <PlayInput.Primary
          type="text"
          max={500}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="type-message"
          className="flex-1 rounded-2xl px-4 py-3 text-sm"
        />
        <PlayButton.Primary
          type="submit"
          title="send"
          className="whitespace-nowrap rounded-2xl px-6 py-3"
        />
      </form>
    </div>
  );
};
