import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useChat } from "@/hooks/contexts/chatContext";
import { useTranslations } from "next-intl";
import { Contact } from "@/types/api";
import React from "react";

export const Conversation: React.FC<{
  activeContact: Contact;
  handleSendMessage: (e: React.SubmitEvent<Element>) => void;
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
}> = ({ activeContact, handleSendMessage, messageInput, setMessageInput }) => {
  const { timeoutRemaining, connected } = useChat();
  const t = useTranslations();

  return (
    <div className="h-full min-h-0 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6 shadow-xl flex flex-col justify-between col-span-1 md:col-span-2 overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 pb-4">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr from-indigo-950 to-indigo-600 font-bold text-sm text-white shadow-md">
            {activeContact.avatar}
          </div>
          {activeContact.online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
          )}
        </div>
        <div>
          <PlayText.Primary
            content={activeContact.name}
            className="font-bold text-sm text-white"
          />
          <PlayText.Primary
            id={activeContact.online ? "active-now" : "offline"}
            className="text-[11px] text-slate-400"
          />
        </div>
      </div>

      <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto py-4 px-2">
        {activeContact.messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[75%] ${
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm backdrop-blur-md shadow-md ${
                  isMe
                    ? "bg-white text-slate-950 rounded-br-none font-medium"
                    : "border border-white/10 bg-white/10 text-white rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              <PlayText.Span
                texts={[{ content: msg.time }]}
                className="text-[10px] text-slate-400 mt-1 px-1"
              />
              {/* Display the "seen" status only if the message is sent by the current user and has been seen by the recipient. */}
              {isMe && msg.seen && (
                <PlayText.Primary
                  id="seen"
                  className="text-[10px] text-slate-400 px-1"
                />
              )}
            </div>
          );
        })}
      </div>

      {timeoutRemaining > 0 ? (
        <p role="status" className="shrink-0 pb-3 text-sm text-amber-300">
          {t("chat-timeout-countdown", { seconds: timeoutRemaining })}
        </p>
      ) : null}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 border-t border-white/10 pt-4"
      >
        <fieldset
          disabled={!connected || timeoutRemaining > 0}
          aria-label={t("type-message")}
          className="flex min-w-0 items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlayInput.Primary
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="type-message"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-white/30 focus:outline-none backdrop-blur-md"
          />
          <PlayButton.Primary
            textClassName="text-sm font-semibold text-slate-950"
            type="submit"
            title="send"
            className="rounded-2xl bg-white px-6 py-3 hover:bg-slate-100 transition-all cursor-pointer shadow-lg whitespace-nowrap"
          />
        </fieldset>
      </form>
    </div>
  );
};
