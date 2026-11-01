import { FormEvent, useEffect, useState } from "react";
import { api } from "@/services/api";
import { Sport } from "@/types/api";
import { useHomeCopy } from "../home-copy";
import { HomeDialog } from "./homeDialog";
import styles from "../home.module.css";

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CreateMatchDialog({
  close,
  onCreated,
}: {
  close: () => void;
  onCreated: () => void;
}) {
  const { copy } = useHomeCopy();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsState, setSportsState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [revision, setRevision] = useState(0);
  const [title, setTitle] = useState("");
  const [sportId, setSportId] = useState("");
  const [slots, setSlots] = useState("2");
  const [date, setDate] = useState(localDate);
  const [minimumDate] = useState(localDate);
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = sports.find((sport) => sport.id === sportId);
  useEffect(() => {
    let active = true;
    void api
      .get<Sport[]>("/sports")
      .then(({ data }) => {
        if (active) {
          setSports(data);
          setSportsState("ready");
        }
      })
      .catch(() => {
        if (active) setSportsState("error");
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !title.trim() || !selected || !date || !start || !end) return;
    if (end <= start) {
      setError(copy.timeError);
      return;
    }
    const count = Number(slots);
    if (!Number.isInteger(count) || count < 1 || count > selected.max_players) {
      setError(copy.slotsError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/match-announcements", {
        title: title.trim(),
        sport_id: sportId,
        remaining_player_slots: count,
        start_time: new Date(`${date}T${start}:00`).toISOString(),
        end_time: new Date(`${date}T${end}:00`).toISOString(),
      });
      onCreated();
    } catch {
      setError(copy.createError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HomeDialog
      title={copy.matchTitle}
      description={copy.matchDescription}
      close={close}
      busy={saving}
    >
      <form onSubmit={(event) => void submit(event)}>
        <div className={styles.dialogFields}>
          <label>
            {copy.gameName}
            <input
              required
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.gamePlaceholder}
            />
          </label>
          <div className={styles.formColumns}>
            <label>
              {copy.sport}
              <select
                required
                value={sportId}
                disabled={sportsState !== "ready"}
                onChange={(event) => {
                  const sport = sports.find(
                    (item) => item.id === event.target.value,
                  );
                  setSportId(event.target.value);
                  setSlots(
                    String(
                      Math.min(Number(slots) || 1, sport?.max_players || 1),
                    ),
                  );
                }}
              >
                <option value="">
                  {sportsState === "loading" ? copy.loading : copy.selectSport}
                </option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {copy.spaces}
              <input
                type="number"
                required
                min={1}
                max={selected?.max_players}
                step={1}
                value={slots}
                disabled={!selected}
                onChange={(event) => setSlots(event.target.value)}
              />
            </label>
          </div>
          {sportsState === "error" && (
            <p className={styles.error} role="alert">
              {copy.sportsError}{" "}
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setSportsState("loading");
                  setRevision((value) => value + 1);
                }}
              >
                {copy.retry}
              </button>
            </p>
          )}
          {sportsState === "ready" && sports.length === 0 && (
            <p className={styles.error} role="status">
              {copy.noSports}
            </p>
          )}
          <label>
            {copy.date}
            <input
              type="date"
              required
              min={minimumDate}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <div className={styles.formColumns}>
            <label>
              {copy.start}
              <input
                type="time"
                required
                value={start}
                onChange={(event) => {
                  setStart(event.target.value);
                  setError("");
                }}
              />
            </label>
            <label>
              {copy.end}
              <input
                type="time"
                required
                value={end}
                onChange={(event) => {
                  setEnd(event.target.value);
                  setError("");
                }}
              />
            </label>
          </div>
          <p className={styles.hint}>{copy.timezone}</p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.textButton}
            onClick={close}
            disabled={saving}
          >
            {copy.cancel}
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={saving || !title.trim() || !selected}
          >
            {saving ? copy.creating : copy.create}
          </button>
        </footer>
      </form>
    </HomeDialog>
  );
}
