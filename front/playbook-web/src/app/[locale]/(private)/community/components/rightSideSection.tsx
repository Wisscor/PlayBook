import { useState } from "react";
import { MatchAnnouncement, PlayRequest, Sport } from "@/types/api";
import { useCommunityCopy } from "../community-copy";
import { Icon, MatchFilters, Pagination } from "../community-ui";
import { MatchCard } from "./matchCard";
import { MatchFilterSection } from "./matchFilterSection";
import styles from "../community.module.css";

export function RightSideSection({
  userId,
  matches,
  total,
  pageNumber,
  pages,
  scroll,
  requests,
  onRequested,
  openFilters,
  filters,
  sports,
  loading,
  error,
  retry,
  requestsReady,
  requestsError,
  retryRequests,
}: {
  requestsReady: boolean;
  requestsError: boolean;
  retryRequests: () => void;
  userId?: string;
  matches: MatchAnnouncement[];
  total: number;
  pageNumber: number;
  pages: number;
  scroll: (page: number) => void;
  requests: PlayRequest[];
  onRequested: (request: PlayRequest) => void;
  openFilters: () => void;
  filters: MatchFilters;
  sports: Sport[];
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const { copy } = useCommunityCopy();
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const filtered = matches.filter((match) =>
    `${match.title} ${match.sport.name} ${match.owner.firstname} ${match.owner.lastname} ${match.owner.username}`
      .toLocaleLowerCase()
      .includes(query),
  );
  return (
    <section
      className={styles.gamesPanel}
      aria-labelledby="community-games-title"
      aria-busy={loading}
    >
      <header className={styles.panelHeading}>
        <div>
          <h2 id="community-games-title">{copy.games}</h2>
          <p>{copy.gamesIntro}</p>
        </div>
        <span className={styles.totalBadge}>{total}</span>
      </header>
      <label className={styles.search}>
        <Icon name="search" size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
        />
      </label>
      <MatchFilterSection
        open={openFilters}
        filters={filters}
        sports={sports}
      />
      {requestsError && (
        <p className={styles.requestError} role="status">
          {copy.requestError}{" "}
          <button
            type="button"
            className={styles.textButton}
            onClick={retryRequests}
          >
            {copy.retry}
          </button>
        </p>
      )}
      {loading ? (
        <div className={styles.matchSkeleton} role="status">
          <span className={styles.srOnly}>{copy.loading}</span>
          {[0, 1, 2].map((item) => (
            <div key={item} />
          ))}
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p>{copy.matchError}</p>
          <button type="button" className={styles.textButton} onClick={retry}>
            {copy.retry}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon name="calendar" size={30} />
          <h3>{copy.noGames}</h3>
          <p>{copy.noGamesBody}</p>
        </div>
      ) : (
        <div>
          {filtered.map((match) => (
            <MatchCard
              requestsReady={requestsReady}
              key={match.id}
              match={match}
              userId={userId}
              request={requests.find(
                (request) => request.announcement_id === match.id,
              )}
              onRequested={onRequested}
            />
          ))}
        </div>
      )}
      <Pagination
        page={pageNumber}
        pages={pages}
        onChange={scroll}
        previous={copy.previous}
        next={copy.next}
        label={copy.games}
      />
    </section>
  );
}
