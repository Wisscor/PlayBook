"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/contexts/authContext";
import { useNavigation } from "@/hooks/useNavigation";
import { api } from "@/services/api";
import {
  Feed,
  FeedPaginated,
  MatchAnnouncement,
  MatchAnnouncementPaginated,
  PlayRequest,
  PlayRequestPaginated,
  Sport,
} from "@/types/api";
import { User } from "@/types/user";
import { FilterMatchModal } from "./components/filterMatchModal";
import { LeftSideSection } from "./components/leftSideSection";
import { PostsFeed } from "./components/postsFeed";
import { RightSideSection } from "./components/rightSideSection";
import { useCommunityCopy } from "./community-copy";
import {
  Avatar,
  Court,
  emptyFilters,
  Icon,
  MatchFilters,
  Pagination,
} from "./community-ui";
import styles from "./community.module.css";

type Collection<T> = {
  items: T[];
  total: number;
  pages: number;
  loading: boolean;
  error: boolean;
};
const initialCollection = {
  items: [],
  total: 0,
  pages: 0,
  loading: true,
  error: false,
};

export default function CommunityPage() {
  const { connectedUser, setConnectedUser } = useAuth();
  const { goSearch } = useNavigation();
  const { copy } = useCommunityCopy();
  const [feed, setFeed] = useState<Collection<Feed>>(initialCollection);
  const [games, setGames] =
    useState<Collection<MatchAnnouncement>>(initialCollection);
  const [feedPage, setFeedPage] = useState(1);
  const [gamePage, setGamePage] = useState(1);
  const [feedRevision, setFeedRevision] = useState(0);
  const [gameRevision, setGameRevision] = useState(0);
  const [filters, setFilters] = useState<MatchFilters>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsError, setSportsError] = useState(false);
  const [requestsState, setRequestsState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [requestsRevision, setRequestsRevision] = useState(0);
  const [profileError, setProfileError] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Feed[]>([]);
  const [requests, setRequests] = useState<PlayRequest[]>([]);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<"" | "success" | "error">("");
  const [mobileTab, setMobileTab] = useState<"feed" | "games">("feed");

  useEffect(() => {
    if (connectedUser?.id) return;
    let active = true;
    void api
      .get<User>("/users/me")
      .then((response) => {
        if (active) setConnectedUser(response.data);
      })
      .catch(() => {
        if (active) setProfileError(true);
      });
    return () => {
      active = false;
    };
  }, [connectedUser?.id, setConnectedUser]);

  useEffect(() => {
    let active = true;
    void api
      .get<FeedPaginated>("/feed", { params: { page: feedPage, size: 8 } })
      .then(({ data }) => {
        if (active)
          setFeed({
            items: data.items,
            total: data.total,
            pages: data.pages,
            loading: false,
            error: false,
          });
      })
      .catch(() => {
        if (active)
          setFeed((current) => ({ ...current, loading: false, error: true }));
      });
    return () => {
      active = false;
    };
  }, [feedPage, feedRevision]);

  useEffect(() => {
    let active = true;
    const params: Record<string, string | number> = {
      page: gamePage,
      size: 5,
      sort_by: "start_time",
      sort_order: "asc",
    };
    if (filters.sportId) params.sport_id = filters.sportId;
    if (filters.status) params.match_status = filters.status;
    if (filters.date) {
      params.start_from = new Date(
        `${filters.date}T${filters.startTime || "00:00"}:00`,
      ).toISOString();
      params.end_to = new Date(
        `${filters.date}T${filters.endTime || "23:59"}:59`,
      ).toISOString();
    }
    void api
      .get<MatchAnnouncementPaginated>("/match-announcements", { params })
      .then(({ data }) => {
        if (active)
          setGames({
            items: data.items,
            total: data.total,
            pages: data.pages,
            loading: false,
            error: false,
          });
      })
      .catch(() => {
        if (active)
          setGames((current) => ({ ...current, loading: false, error: true }));
      });
    return () => {
      active = false;
    };
  }, [gamePage, filters, gameRevision]);

  useEffect(() => {
    let active = true;
    void api
      .get<Sport[]>("/sports")
      .then(({ data }) => {
        if (active) setSports(data);
      })
      .catch(() => {
        if (active) setSportsError(true);
      });
    // Fetch once for the page instead of repeating the request in every match card.
    void api
      .get<PlayRequestPaginated>("/play-requests", {
        params: { role: "sent", page: 1, size: 100 },
      })
      .then(async ({ data }) => {
        const remaining = await Promise.all(
          Array.from({ length: Math.max(0, data.pages - 1) }, (_, index) =>
            api.get<PlayRequestPaginated>("/play-requests", {
              params: { role: "sent", page: index + 2, size: 100 },
            }),
          ),
        );
        if (active) {
          setRequests([
            ...data.items,
            ...remaining.flatMap((response) => response.data.items),
          ]);
          setRequestsState("ready");
        }
      })
      .catch(() => {
        if (active) setRequestsState("error");
      });
    return () => {
      active = false;
    };
  }, [requestsRevision]);

  const changeFeedPage = (page: number) => {
    setFeed((current) => ({ ...current, loading: true }));
    setFeedPage(page);
  };
  const changeGamePage = (page: number) => {
    setGames((current) => ({ ...current, loading: true }));
    setGamePage(page);
  };
  const retryFeed = () => {
    setFeed((current) => ({ ...current, loading: true }));
    setFeedRevision((value) => value + 1);
  };
  const applyFilters = (next: MatchFilters) => {
    setGames((current) => ({ ...current, loading: true }));
    setGamePage(1);
    setFilters(next);
    setFilterOpen(false);
  };
  const post = async (event: FormEvent) => {
    event.preventDefault();
    if (!caption.trim() || posting || !connectedUser?.id) return;
    setPosting(true);
    setPostStatus("");
    try {
      const { data } = await api.post<Feed>("/posts", {
        caption: caption.trim(),
      });
      setRecentPosts((current) => [data, ...current]);
      setCaption("");
      setPostStatus("success");
      setFeedPage(1);
      retryFeed();
    } catch {
      setPostStatus("error");
    } finally {
      setPosting(false);
    }
  };
  const name =
    [connectedUser?.firstname, connectedUser?.lastname]
      .filter(Boolean)
      .join(" ") || copy.profile;

  const visibleFeeds =
    feedPage === 1
      ? [
          ...recentPosts,
          ...feed.items.filter(
            (item) => !recentPosts.some((post) => post.id === item.id),
          ),
        ]
      : feed.items;

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.communityLabel}>
            <span />
            {copy.community}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
        <Court />
      </header>
      <nav className={styles.mobileTabs} aria-label={copy.community}>
        <button
          type="button"
          aria-pressed={mobileTab === "feed"}
          onClick={() => setMobileTab("feed")}
        >
          <Icon name="chat" size={18} />
          {copy.feed}
        </button>
        <button
          type="button"
          aria-pressed={mobileTab === "games"}
          onClick={() => setMobileTab("games")}
        >
          <Icon name="calendar" size={18} />
          {copy.games}
        </button>
      </nav>
      {profileError && (
        <p role="alert" className={styles.inlineError}>
          {copy.profileError}
        </p>
      )}
      <div className={styles.layout}>
        <LeftSideSection user={connectedUser} />
        <section
          className={styles.feedColumn}
          data-active={mobileTab === "feed"}
          aria-labelledby="community-feed-title"
        >
          <header className={styles.feedHeading}>
            <h2 id="community-feed-title">{copy.feed}</h2>
            <p>{copy.feedIntro}</p>
          </header>
          <form
            className={styles.composer}
            onSubmit={(event) => void post(event)}
          >
            <div className={styles.composerInput}>
              <Avatar name={name} src={connectedUser?.avatar} />
              <textarea
                aria-label={copy.composer}
                placeholder={copy.composer}
                value={caption}
                onChange={(event) => {
                  setCaption(event.target.value);
                  setPostStatus("");
                }}
                maxLength={2000}
                rows={2}
                required
              />
            </div>
            <div className={styles.composerFooter}>
              <span>
                {caption.length > 0
                  ? `${caption.length} / 2000`
                  : copy.audience}
              </span>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={posting || !caption.trim() || !connectedUser?.id}
              >
                {posting ? copy.posting : copy.post}
              </button>
            </div>
            {postStatus && (
              <p
                role={postStatus === "error" ? "alert" : "status"}
                className={
                  postStatus === "error" ? styles.inlineError : styles.success
                }
              >
                {postStatus === "error" ? copy.postError : copy.posted}
              </p>
            )}
          </form>
          <div aria-busy={feed.loading}>
            {feed.loading ? (
              <div className={styles.feedSkeleton} role="status">
                <span className={styles.srOnly}>{copy.loading}</span>
                {[0, 1, 2].map((item) => (
                  <div key={item}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : feed.error ? (
              <div className={styles.feedEmpty}>
                <Icon name="chat" size={32} />
                <h3>{copy.feedError}</h3>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={retryFeed}
                >
                  {copy.retry}
                </button>
              </div>
            ) : visibleFeeds.length === 0 ? (
              <div className={styles.feedEmpty}>
                <Icon name="users" size={36} />
                <h3>{copy.feedEmpty}</h3>
                <p>{copy.feedEmptyBody}</p>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={goSearch}
                >
                  {copy.findPlayers}
                </button>
              </div>
            ) : (
              <PostsFeed feeds={visibleFeeds} />
            )}
          </div>
          <Pagination
            page={feedPage}
            pages={feed.pages}
            previous={copy.previous}
            next={copy.next}
            onChange={changeFeedPage}
            label={copy.feed}
          />
        </section>
        <div className={styles.gamesColumn} data-active={mobileTab === "games"}>
          <RightSideSection
            requestsReady={requestsState === "ready"}
            requestsError={requestsState === "error"}
            retryRequests={() => {
              setRequestsState("loading");
              setRequestsRevision((value) => value + 1);
            }}
            userId={connectedUser?.id}
            matches={games.items}
            total={games.total}
            pages={games.pages}
            pageNumber={gamePage}
            scroll={changeGamePage}
            requests={requests}
            onRequested={(request) =>
              setRequests((current) => [
                ...current.filter(
                  (item) => item.announcement_id !== request.announcement_id,
                ),
                request,
              ])
            }
            openFilters={() => setFilterOpen(true)}
            filters={filters}
            sports={sports}
            loading={games.loading}
            error={games.error}
            retry={() => {
              setGames((current) => ({ ...current, loading: true }));
              setGameRevision((value) => value + 1);
            }}
          />
        </div>
      </div>
      {filterOpen && (
        <FilterMatchModal
          filters={filters}
          sports={sports}
          sportsError={sportsError}
          close={() => setFilterOpen(false)}
          apply={applyFilters}
        />
      )}
    </div>
  );
}
