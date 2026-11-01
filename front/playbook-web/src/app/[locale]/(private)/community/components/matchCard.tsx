import { useState } from "react";
import { api } from "@/services/api";
import { ApiError, MatchAnnouncement, PlayRequest } from "@/types/api";
import { useNavigation } from "@/hooks/useNavigation";
import { useCommunityCopy } from "../community-copy";
import { Icon } from "../community-ui";
import styles from "../community.module.css";

export function MatchCard({
  match,
  userId,
  request,
  onRequested,
  requestsReady,
}: {
  requestsReady: boolean;
  match: MatchAnnouncement;
  userId?: string;
  request?: PlayRequest;
  onRequested: (request: PlayRequest) => void;
}) {
  const { copy, locale } = useCommunityCopy();
  const { goUserProfile } = useNavigation();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const date = new Date(match.start_time);
  const owner = userId === match.owner.id;
  const finished = match.match_status === "finished";
  const full = match.remaining_player_slots <= 0;
  const requestStatus = request?.status;
  const stateLabel = owner
    ? copy.owner
    : requestStatus === "accepted"
      ? copy.accepted
      : requestStatus === "pending"
        ? copy.pending
        : requestStatus === "declined"
          ? copy.declined
          : finished
            ? copy.finished
            : full
              ? copy.full
              : "";
  const canJoin = !owner && !requestStatus && !finished && !full && !duplicate;
  const join = async () => {
    if (joining || !canJoin || !userId) return;
    setJoining(true);
    setError("");
    try {
      const response = await api.post<PlayRequest>(
        `/match-announcements/${match.id}/play-requests`,
      );
      onRequested(response.data);
    } catch (failure) {
      const conflict =
        (failure as ApiError).errorCode === "REQUEST_ALREADY_SENT";
      setDuplicate(conflict);
      setError(conflict ? copy.duplicate : copy.joinError);
    } finally {
      setJoining(false);
    }
  };
  return (
    <article className={styles.matchCard}>
      <div className={styles.matchMain}>
        <time className={styles.dateTile} dateTime={match.start_time}>
          <span>{date.toLocaleDateString(locale, { month: "short" })}</span>
          <strong>{date.toLocaleDateString(locale, { day: "2-digit" })}</strong>
          <span>{date.toLocaleDateString(locale, { weekday: "short" })}</span>
        </time>
        <div className={styles.matchDetails}>
          <div className={styles.matchSport}>
            <span>{match.sport.name}</span>
            {match.match_status === "live" && (
              <span className={styles.live}>{copy.live}</span>
            )}
          </div>
          <h3>{match.title}</h3>
          <p>
            {date.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(match.end_time).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <button
            type="button"
            className={styles.host}
            onClick={() => goUserProfile(match.owner.id)}
          >
            {copy.hosted}{" "}
            {owner ? copy.you : match.owner.firstname || match.owner.username}
          </button>
        </div>
      </div>
      <div className={styles.matchActions}>
        <span className={styles.spots}>
          <Icon name="users" size={15} />
          {match.remaining_player_slots}{" "}
          {match.remaining_player_slots === 1 ? copy.spot : copy.spots}
        </span>
        {canJoin ? (
          <button
            type="button"
            className={styles.joinButton}
            disabled={joining || !userId || !requestsReady}
            onClick={() => void join()}
          >
            {joining ? copy.joining : copy.join}
          </button>
        ) : (
          <span className={styles.requestState} data-status={requestStatus}>
            {requestStatus === "accepted" && <Icon name="check" size={14} />}
            {stateLabel}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className={styles.inlineError}>
          {error}
        </p>
      )}
    </article>
  );
}
