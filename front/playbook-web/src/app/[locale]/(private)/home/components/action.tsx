import { Icon } from "../../community/community-ui";
import styles from "../home.module.css";

export function Action({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: "post" | "users" | "chat";
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles.action} onClick={onClick}>
      <span className={styles.actionIcon} data-kind={icon}>
        <Icon name={icon} size={23} />
      </span>
      <span className={styles.actionText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className={styles.actionChevron}>
        <Icon name="chevron" size={17} />
      </span>
    </button>
  );
}
