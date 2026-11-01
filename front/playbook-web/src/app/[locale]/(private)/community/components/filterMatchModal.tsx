import { FormEvent, useEffect, useRef, useState } from "react";
import { Sport } from "@/types/api";
import { useCommunityCopy } from "../community-copy";
import { emptyFilters, Icon, MatchFilters } from "../community-ui";
import styles from "../community.module.css";

export function FilterMatchModal({
  filters,
  sports,
  sportsError,
  close,
  apply,
}: {
  filters: MatchFilters;
  sports: Sport[];
  sportsError: boolean;
  close: () => void;
  apply: (filters: MatchFilters) => void;
}) {
  const { copy } = useCommunityCopy();
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  const change = (field: keyof MatchFilters, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      ((draft.startTime || draft.endTime) && !draft.date) ||
      (draft.startTime && draft.endTime && draft.endTime <= draft.startTime)
    ) {
      setError(true);
      return;
    }
    apply(draft);
  };
  return (
    <dialog
      ref={dialog}
      className={styles.filterDialog}
      aria-labelledby="community-filter-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form onSubmit={submit}>
        <header className={styles.dialogHeader}>
          <div>
            <h2 id="community-filter-title">{copy.filterTitle}</h2>
            <p>{copy.filterIntro}</p>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={close}
            aria-label={copy.close}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.dialogFields}>
          <label>
            {copy.sport}
            <select
              value={draft.sportId}
              onChange={(event) => change("sportId", event.target.value)}
            >
              <option value="">{copy.allSports}</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </label>
          {sportsError && (
            <p role="status" className={styles.inlineError}>
              {copy.sportError}
            </p>
          )}
          <label>
            {copy.status}
            <select
              value={draft.status}
              onChange={(event) => change("status", event.target.value)}
            >
              <option value="">{copy.allStatuses}</option>
              <option value="upcoming">{copy.upcoming}</option>
              <option value="live">{copy.live}</option>
              <option value="finished">{copy.finished}</option>
            </select>
          </label>
          <label>
            {copy.date}
            <input
              type="date"
              value={draft.date}
              onChange={(event) => change("date", event.target.value)}
            />
          </label>
          <div className={styles.timeFields}>
            <label>
              {copy.starts}
              <input
                type="time"
                value={draft.startTime}
                onChange={(event) => change("startTime", event.target.value)}
              />
            </label>
            <label>
              {copy.ends}
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) => change("endTime", event.target.value)}
              />
            </label>
          </div>
          <p className={styles.fieldHint}>{copy.localTime}</p>
          {error && (
            <p role="alert" className={styles.inlineError}>
              {copy.timeError}
            </p>
          )}
        </div>
        <footer className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              setDraft(emptyFilters);
              setError(false);
            }}
          >
            {copy.reset}
          </button>
          <button type="submit" className={styles.primaryButton}>
            {copy.apply}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
