import { FormEvent, useState } from "react";
import { api } from "@/services/api";
import { useHomeCopy } from "../home-copy";
import { HomeDialog } from "./homeDialog";
import styles from "../home.module.css";

export function PostModal({
  close,
  onCreated,
}: {
  close: () => void;
  onCreated: () => void;
}) {
  const { copy } = useHomeCopy();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    setError(false);
    try {
      await api.post("/posts", { caption: text.trim() });
      onCreated();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  return (
    <HomeDialog
      title={copy.postTitle}
      description={copy.postIntro}
      close={close}
      busy={saving}
    >
      <form onSubmit={(event) => void submit(event)}>
        <div className={styles.dialogFields}>
          <label className={styles.srOnly} htmlFor="home-post">
            {copy.postPlaceholder}
          </label>
          <textarea
            id="home-post"
            required
            maxLength={2000}
            rows={6}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(false);
            }}
            placeholder={copy.postPlaceholder}
          />
          <span className={styles.characterCount}>{text.length} / 2000</span>
          {error && (
            <p className={styles.error} role="alert">
              {copy.postError}
            </p>
          )}
        </div>
        <footer className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.textButton}
            disabled={saving}
            onClick={close}
          >
            {copy.cancel}
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={saving || !text.trim()}
          >
            {saving ? copy.posting : copy.publish}
          </button>
        </footer>
      </form>
    </HomeDialog>
  );
}
