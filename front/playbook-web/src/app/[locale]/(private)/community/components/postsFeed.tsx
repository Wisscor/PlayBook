import { useEffect, useState } from "react";
import { Feed } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";
import { useCommunityCopy } from "../community-copy";
import { Avatar } from "../community-ui";
import styles from "../community.module.css";

export function PostsFeed({ feeds }: { feeds: Feed[] }) {
  const { locale, copy } = useCommunityCopy();
  const { goUserProfile } = useNavigation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const relative = (value: string) => {
    const seconds = Math.max(
      0,
      Math.floor((now - new Date(value).getTime()) / 1000),
    );
    if (!Number.isFinite(seconds)) return "";
    const [amount, unit] =
      seconds < 60
        ? [seconds, "second"]
        : seconds < 3600
          ? [Math.floor(seconds / 60), "minute"]
          : seconds < 86400
            ? [Math.floor(seconds / 3600), "hour"]
            : [Math.floor(seconds / 86400), "day"];
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -Number(amount),
      unit as Intl.RelativeTimeFormatUnit,
    );
  };
  return (
    <div className={styles.feedList}>
      {feeds.map((feed) => {
        const name =
          [feed.author?.firstname, feed.author?.lastname]
            .filter(Boolean)
            .join(" ") ||
          feed.author?.username ||
          copy.community;
        return (
          <article key={feed.id} className={styles.postCard}>
            <div className={styles.postHeader}>
              <button
                type="button"
                className={styles.author}
                onClick={() => goUserProfile(feed.author.id)}
                aria-label={`${copy.viewProfile}: ${name}`}
              >
                <Avatar name={name} src={feed.author?.avatar} />
                <span className={styles.authorText}>
                  <strong>{name}</strong>
                  <span>@{feed.author?.username}</span>
                </span>
              </button>
              <time
                dateTime={feed.created_at}
                title={new Date(feed.created_at).toLocaleString(locale)}
              >
                {relative(feed.created_at)}
              </time>
            </div>
            <p className={styles.postCaption}>{feed.caption}</p>
          </article>
        );
      })}
    </div>
  );
}
