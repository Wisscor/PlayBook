import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { Avatar, Icon } from "../../community/community-ui";
import { ChatContact } from "../chat-types";
import { useChatCopy } from "../chat-copy";
import styles from "../chat.module.css";

export function Conversation({
  contact,
  currentUserId,
  connected,
  input,
  setInput,
  send,
  back,
  loading,
  historyError,
  retry,
  sendError,
}: {
  contact: ChatContact;
  currentUserId?: string;
  connected: boolean;
  input: string;
  setInput: (text: string) => void;
  send: () => void;
  back: () => void;
  loading: boolean;
  historyError: boolean;
  retry: () => void;
  sendError: boolean;
}) {
  const { copy, locale } = useChatCopy();
  const { goUserProfile } = useNavigation();
  const scroll = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef(true);
  const previous = useRef({ conversation: "", message: "" });
  const [away, setAway] = useState(false);
  const [today] = useState(() => new Date());
  useEffect(() => {
    const node = textarea.current;
    if (node) {
      node.style.height = "auto";
      node.style.height = `${Math.min(node.scrollHeight, 128)}px`;
    }
  }, [input, contact.id]);
  const last = contact.messages.at(-1);
  const lastReadIndex = contact.messages.findIndex(
    (message) => message.id === contact.readThrough,
  );
  useEffect(() => {
    const node = scroll.current;
    if (!node) return;
    const changedConversation = previous.current.conversation !== contact.id;
    const ownNewMessage =
      last?.sender_id === currentUserId &&
      last?.id !== previous.current.message;
    if (changedConversation || bottom.current || ownNewMessage) {
      node.scrollTop = node.scrollHeight;
      bottom.current = true;
    }
    previous.current = { conversation: contact.id, message: last?.id || "" };
  }, [
    contact.id,
    contact.messages.length,
    last?.id,
    last?.sender_id,
    currentUserId,
  ]);
  const label = (value: string) => {
    const date = new Date(value);
    if (date.toDateString() === today.toDateString()) return copy.today;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return copy.yesterday;
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };
  return (
    <section className={styles.conversation} aria-label={contact.name}>
      <header className={styles.conversationHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={back}
          aria-label={copy.back}
        >
          <span>
            <Icon name="chevron" size={21} />
          </span>
        </button>
        <button
          type="button"
          className={styles.peerIdentity}
          onClick={() => goUserProfile(contact.peerId)}
          aria-label={`${copy.viewProfile}: ${contact.name}`}
        >
          <Avatar name={contact.name} src={contact.avatar} />
          <span>
            <strong dir="auto">{contact.name}</strong>
            <span
              className={styles.peerStatus}
              data-online={connected && contact.online}
            >
              <span />
              {!connected
                ? copy.unavailable
                : contact.online
                  ? copy.online
                  : copy.offline}
            </span>
          </span>
        </button>
        <button
          type="button"
          className={styles.profileButton}
          onClick={() => goUserProfile(contact.peerId)}
        >
          <Icon name="users" size={17} />
          <span>{copy.viewProfile}</span>
        </button>
      </header>
      {historyError && (
        <div className={styles.historyError} role="alert">
          {copy.historyError}
          <button type="button" className={styles.textButton} onClick={retry}>
            {copy.retry}
          </button>
        </div>
      )}
      <div className={styles.conversationBody}>
        <div
          ref={scroll}
          className={styles.messageScroll}
          role="log"
          aria-label={contact.name}
          aria-live="polite"
          onScroll={(event) => {
            const node = event.currentTarget;
            const near =
              node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            bottom.current = near;
            setAway(!near);
          }}
        >
          {loading && (
            <p className={styles.historyLoading} role="status">
              {copy.historyLoading}
            </p>
          )}
          {!loading && !historyError && contact.messages.length === 0 && (
            <div className={styles.emptyThread}>
              <Icon name="chat" size={29} />
              <h3>{copy.emptyChat}</h3>
              <p>{copy.emptyChatBody}</p>
            </div>
          )}
          {contact.messages.map((message, index) => {
            const mine = message.sender_id === currentUserId;
            const previousMessage = contact.messages[index - 1];
            const day = new Date(message.created_at).toDateString();
            const newDay =
              !previousMessage ||
              new Date(previousMessage.created_at).toDateString() !== day;
            const grouped =
              !newDay && previousMessage?.sender_id === message.sender_id;
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className={styles.dayDivider}>
                    <span>{label(message.created_at)}</span>
                  </div>
                )}
                <div
                  className={styles.message}
                  data-mine={mine}
                  data-grouped={grouped}
                >
                  <p className={styles.bubble} dir="auto">
                    {message.body}
                  </p>
                  <span className={styles.messageMeta}>
                    <time dateTime={message.created_at}>
                      {new Date(message.created_at).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {mine && (
                      <span
                        className={styles.receipt}
                        data-seen={lastReadIndex >= index}
                      >
                        <Icon name="check" size={13} />
                        {lastReadIndex >= index ? copy.seen : copy.sent}
                      </span>
                    )}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
        {away && (
          <button
            type="button"
            className={styles.jumpButton}
            onClick={() => {
              const node = scroll.current;
              if (node) node.scrollTop = node.scrollHeight;
              bottom.current = true;
              setAway(false);
            }}
          >
            {copy.jump}
            <span>↓</span>
          </button>
        )}
      </div>
      <form className={styles.composer} onSubmit={submit}>
        {!connected && (
          <p role="status" className={styles.connectionHint}>
            {copy.waiting}
          </p>
        )}
        {sendError && (
          <p role="alert" className={styles.sendError}>
            {copy.sendError}
          </p>
        )}
        <div className={styles.inputRow}>
          <textarea
            ref={textarea}
            key={contact.id}
            rows={1}
            maxLength={500}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={copy.message}
            aria-label={copy.message}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!connected || !input.trim()}
            aria-label={copy.send}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21 3-7 18-4-7-7-4L21 3Z" />
              <path d="m10 14 5-5" />
            </svg>
          </button>
        </div>
        <div className={styles.composerHint}>
          <span>{copy.enter}</span>
          <span>{input.length > 400 ? `${input.length} / 500` : ""}</span>
        </div>
      </form>
    </section>
  );
}
