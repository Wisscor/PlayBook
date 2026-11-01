"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { api } from "@/services/api";
import { MatchAnnouncement, MatchAnnouncementPaginated } from "@/types/api";
import { User } from "@/types/user";
import { ROUTES } from "@/lib/constants";
import { Link } from "../../../../../i18n/navigation";
import { Avatar, Court, Icon } from "../community/community-ui";
import { Action } from "./components/action";
import { CreateMatchDialog } from "./components/createMatchDialog";
import { PostModal } from "./components/postModal";
import { useHomeCopy } from "./home-copy";
import styles from "./home.module.css";

export default function HomePage() {
  const { connectedUser, setConnectedUser } = useAuth();
  const { goProfile, goCommunity, goMessages, goFollowers } = useNavigation();
  const { copy, locale } = useHomeCopy();
  const [today] = useState(() => new Date());
  const [dialog, setDialog] = useState<"" | "match" | "post">("");
  const [notice, setNotice] = useState<"" | "match" | "post">("");
  const [profileError, setProfileError] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const [calendarRevision, setCalendarRevision] = useState(0);
  const [calendar, setCalendar] = useState<{
    game?: MatchAnnouncement;
    loading: boolean;
    error: boolean;
  }>({ loading: true, error: false });
  const userId = connectedUser?.id;

  useEffect(() => {
    if (userId) return;
    let active = true;
    void api
      .get<User>("/users/me")
      .then(({ data }) => {
        if (active) {
          setConnectedUser(data);
          setProfileError(false);
        }
      })
      .catch(() => {
        if (active) setProfileError(true);
      });
    return () => {
      active = false;
    };
  }, [userId, setConnectedUser, profileRevision]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void api
      .get<MatchAnnouncementPaginated>("/match-announcements", {
        params: {
          organizer_id: userId,
          match_status: "upcoming",
          start_from: new Date().toISOString(),
          page: 1,
          size: 1,
          sort_by: "start_time",
          sort_order: "asc",
        },
      })
      .then(({ data }) => {
        if (active)
          setCalendar({ game: data.items[0], loading: false, error: false });
      })
      .catch(() => {
        if (active) setCalendar({ loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [userId, calendarRevision]);

  const name =
    [connectedUser?.firstname, connectedUser?.lastname]
      .filter(Boolean)
      .join(" ") || copy.profile;
  const game = calendar.game;
  const gameDate = game ? new Date(game.start_time) : undefined;
  const count = (value?: number) =>
    typeof value === "number"
      ? new Intl.NumberFormat(locale, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value)
      : "—";
  const retryCalendar = () => {
    setCalendar((current) => ({ ...current, loading: true }));
    setCalendarRevision((value) => value + 1);
  };

  return (
    <div className={styles.root}>
      <header className={styles.welcome}>
        <div>
          <p>{copy.home}</p>
          <h1>
            {connectedUser?.firstname
              ? `${copy.greeting}, ${connectedUser.firstname}.`
              : copy.welcome}
          </h1>
        </div>
        <time
          suppressHydrationWarning
          dateTime={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`}
        >
          <Icon name="calendar" size={17} />
          {today.toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>
      {profileError && (
        <p className={styles.error} role="alert">
          {copy.profileError}{" "}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              setProfileError(false);
              setProfileRevision((value) => value + 1);
            }}
          >
            {copy.retry}
          </button>
        </p>
      )}
      {notice && (
        <div role="status" className={styles.notice}>
          <Icon name="check" size={18} />
          <span>
            {notice === "match" ? copy.matchCreated : copy.postCreated}
          </span>
          <Link href={notice === "match" ? ROUTES.MATCHES : ROUTES.POSTS}>
            {notice === "match" ? copy.allGames : copy.viewPosts}
          </Link>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label={copy.close}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <section className={styles.hero} aria-labelledby="home-hero-title">
        <div className={styles.heroCopy}>
          <span className={styles.heroIntro}>{copy.intro}</span>
          <h2 id="home-hero-title">{copy.title}</h2>
          <p>{copy.description}</p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.heroPrimary}
              onClick={() => setDialog("match")}
            >
              <Icon name="calendar" size={18} />
              {copy.create}
            </button>
            <button
              type="button"
              className={styles.heroSecondary}
              onClick={goCommunity}
            >
              {copy.discover}
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <Court />
        </div>
      </section>
      <div className={styles.contentGrid}>
        <section
          aria-labelledby="home-actions-title"
          className={styles.actionsSection}
        >
          <header className={styles.sectionHeading}>
            <h2 id="home-actions-title">{copy.shortcuts}</h2>
            <p>{copy.shortcutsIntro}</p>
          </header>
          <div className={styles.actionList}>
            <Action
              title={copy.post}
              description={copy.postDescription}
              icon="post"
              onClick={() => setDialog("post")}
            />
            <Action
              title={copy.profile}
              description={copy.profileDescription}
              icon="users"
              onClick={goProfile}
            />
            <Action
              title={copy.messages}
              description={copy.messagesDescription}
              icon="chat"
              onClick={() => goMessages()}
            />
          </div>
          <div className={styles.playerCard}>
            <button
              type="button"
              className={styles.playerIdentity}
              onClick={goProfile}
              aria-label={copy.viewProfile}
            >
              <Avatar name={name} src={connectedUser?.avatar} />
              <span>
                <strong>{name}</strong>
                <span>
                  {connectedUser?.username
                    ? `@${connectedUser.username}`
                    : copy.playerCard}
                </span>
              </span>
            </button>
            <div className={styles.playerStats}>
              <button
                type="button"
                onClick={() => goFollowers("followers", userId)}
              >
                <strong>{count(connectedUser?.followers_count)}</strong>
                <span>{copy.followers}</span>
              </button>
              <button
                type="button"
                onClick={() => goFollowers("following", userId)}
              >
                <strong>{count(connectedUser?.following_count)}</strong>
                <span>{copy.following}</span>
              </button>
              <Link href={ROUTES.POSTS}>
                <strong>{count(connectedUser?.posts_count)}</strong>
                <span>{copy.posts}</span>
              </Link>
            </div>
          </div>
        </section>
        <aside className={styles.sideColumn}>
          <section
            className={styles.calendarPanel}
            aria-labelledby="home-next-title"
            aria-busy={calendar.loading && !profileError}
          >
            <header className={styles.calendarHeading}>
              <span className={styles.calendarIcon}>
                <Icon name="calendar" size={20} />
              </span>
              <h2 id="home-next-title">{copy.next}</h2>
            </header>
            {profileError || calendar.error ? (
              <div className={styles.calendarEmpty}>
                <p>{copy.calendarError}</p>
                {!profileError && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={retryCalendar}
                  >
                    {copy.retry}
                  </button>
                )}
              </div>
            ) : calendar.loading ? (
              <div className={styles.skeleton} role="status">
                <span className={styles.srOnly}>{copy.loading}</span>
                <span />
                <span />
                <span />
              </div>
            ) : game && gameDate ? (
              <div className={styles.upcomingGame}>
                <div className={styles.gameSummary}>
                  <time className={styles.dateTile} dateTime={game.start_time}>
                    <span>
                      {gameDate.toLocaleDateString(locale, { month: "short" })}
                    </span>
                    <strong>
                      {gameDate.toLocaleDateString(locale, { day: "2-digit" })}
                    </strong>
                    <span>
                      {gameDate.toLocaleDateString(locale, {
                        weekday: "short",
                      })}
                    </span>
                  </time>
                  <div>
                    <span className={styles.sport}>{game.sport.name}</span>
                    <h3 dir="auto">{game.title}</h3>
                    <p>
                      {gameDate.toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(game.end_time).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className={styles.gameDetails}>
                  <span>
                    <Icon name="users" size={16} />
                    {game.remaining_player_slots}{" "}
                    {game.remaining_player_slots === 1 ? copy.spot : copy.spots}
                  </span>
                  <span>{copy.hosting}</span>
                </div>
                <Link className={styles.calendarLink} href={ROUTES.MATCHES}>
                  {copy.allGames}
                  <Icon name="chevron" size={16} />
                </Link>
              </div>
            ) : (
              <div className={styles.calendarEmpty}>
                <h3>{copy.noGames}</h3>
                <p>{copy.noGamesDescription}</p>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => setDialog("match")}
                >
                  {copy.create}
                </button>
              </div>
            )}
          </section>
          <section className={styles.communityCard}>
            <span className={styles.communityIcon}>
              <Icon name="users" size={23} />
            </span>
            <h2>{copy.clubTitle}</h2>
            <p>{copy.clubDescription}</p>
            <button type="button" onClick={goCommunity}>
              {copy.clubButton}
              <Icon name="chevron" size={15} />
            </button>
          </section>
        </aside>
      </div>
      {dialog === "match" && (
        <CreateMatchDialog
          close={() => setDialog("")}
          onCreated={() => {
            setDialog("");
            setNotice("match");
            retryCalendar();
          }}
        />
      )}
      {dialog === "post" && (
        <PostModal
          close={() => setDialog("")}
          onCreated={() => {
            setDialog("");
            setNotice("post");
            setConnectedUser((current) =>
              current
                ? { ...current, posts_count: (current.posts_count ?? 0) + 1 }
                : current,
            );
          }}
        />
      )}
    </div>
  );
}
