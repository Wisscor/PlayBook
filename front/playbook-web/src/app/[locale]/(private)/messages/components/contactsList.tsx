import { useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";
import { Avatar, Icon } from "../../community/community-ui";
import { ChatContact } from "../chat-types";
import { useChatCopy } from "../chat-copy";
import styles from "../chat.module.css";

export function ContactsList({
  contacts,
  selectedId,
  select,
  connected,
  currentUserId,
}: {
  contacts: ChatContact[];
  selectedId: string;
  select: (id: string) => void;
  connected: boolean;
  currentUserId?: string;
}) {
  const { copy, locale } = useChatCopy();
  const { goSearch } = useNavigation();
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = search.trim().toLocaleLowerCase();
  const filtered = contacts.filter(
    (contact) =>
      (!unreadOnly || contact.unread > 0) &&
      `${contact.name} ${contact.username}`.toLocaleLowerCase().includes(query),
  );
  const unread = contacts.reduce((sum, contact) => sum + contact.unread, 0);
  return (
    <aside className={styles.sidebar} aria-label={copy.inbox}>
      <header className={styles.inboxHeader}>
        <h2>{copy.inbox}</h2>
        <button
          type="button"
          className={styles.iconButton}
          onClick={goSearch}
          aria-label={copy.findPlayers}
        >
          <Icon name="users" size={19} />
        </button>
      </header>
      <label className={styles.search}>
        <Icon name="search" size={18} />
        <input
          type="search"
          placeholder={copy.search}
          aria-label={copy.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className={styles.listFilters} aria-label={copy.inbox}>
        <button
          type="button"
          aria-pressed={!unreadOnly}
          onClick={() => setUnreadOnly(false)}
        >
          {copy.all}
        </button>
        <button
          type="button"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(true)}
        >
          {copy.unread}
          {unread > 0 && (
            <span>{new Intl.NumberFormat(locale).format(unread)}</span>
          )}
        </button>
      </div>
      <div className={styles.contactList}>
        {filtered.length === 0 ? (
          <div className={styles.listEmpty}>
            <Icon name={query ? "search" : "chat"} size={27} />
            <h3>
              {query
                ? copy.noResults
                : unreadOnly
                  ? copy.noUnread
                  : copy.noContacts}
            </h3>
            <p>
              {query ? copy.searchAgain : unreadOnly ? "" : copy.noContactsBody}
            </p>
            {!query && !unreadOnly && (
              <button
                type="button"
                className={styles.textButton}
                onClick={goSearch}
              >
                {copy.findPlayers}
              </button>
            )}
          </div>
        ) : (
          filtered.map((contact) => {
            const last = contact.messages.at(-1);
            const preview = last
              ? `${last.sender_id === currentUserId ? `${copy.you}: ` : ""}${last.body}`
              : contact.unread
                ? `${contact.unread} ${contact.unread === 1 ? copy.unreadMessage : copy.unreadMessages}`
                : copy.open;
            return (
              <button
                type="button"
                key={contact.id}
                className={styles.contact}
                aria-current={contact.id === selectedId ? "true" : undefined}
                onClick={() => select(contact.id)}
              >
                <span className={styles.contactAvatar}>
                  <Avatar name={contact.name} src={contact.avatar} />
                  <span
                    className={styles.presenceDot}
                    data-online={connected && contact.online}
                    aria-label={
                      !connected
                        ? copy.unavailable
                        : contact.online
                          ? copy.online
                          : copy.offline
                    }
                  />
                </span>
                <span className={styles.contactText}>
                  <span className={styles.contactTop}>
                    <strong dir="auto">{contact.name}</strong>
                    {last && (
                      <time dateTime={last.created_at}>
                        {new Date(last.created_at).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    )}
                  </span>
                  <span className={styles.contactBottom}>
                    <span>{preview}</span>
                    {contact.unread > 0 && (
                      <span
                        className={styles.unreadBadge}
                        aria-label={`${contact.unread} ${copy.unreadMessages}`}
                      >
                        {contact.unread > 99
                          ? "99+"
                          : new Intl.NumberFormat(locale).format(
                              contact.unread,
                            )}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      <footer className={styles.sidebarFooter}>
        <span className={styles.connectionDot} data-connected={connected} />
        {connected ? copy.connected : copy.reconnecting}
      </footer>
    </aside>
  );
}
