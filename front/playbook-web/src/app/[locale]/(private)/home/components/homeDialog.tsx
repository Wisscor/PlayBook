import { ReactNode, useEffect, useRef } from "react";
import { Icon } from "../../community/community-ui";
import { useHomeCopy } from "../home-copy";
import styles from "../home.module.css";

export function HomeDialog({
  title,
  description,
  close,
  busy,
  children,
}: {
  title: string;
  description: string;
  close: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  const { copy } = useHomeCopy();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="home-dialog-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) close();
      }}
    >
      <header className={styles.dialogHeader}>
        <div>
          <h2 id="home-dialog-title">{title}</h2>
          <p>{description}</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={close}
          disabled={busy}
          aria-label={copy.close}
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
