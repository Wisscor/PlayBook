import { Sport } from "@/types/api";
import { useCommunityCopy } from "../community-copy";
import { Icon, MatchFilters } from "../community-ui";
import styles from "../community.module.css";

export function MatchFilterSection({
  open,
  filters,
  sports,
}: {
  open: () => void;
  filters: MatchFilters;
  sports: Sport[];
}) {
  const { copy } = useCommunityCopy();
  const count = [filters.sportId, filters.status, filters.date].filter(
    Boolean,
  ).length;
  const sport = sports.find((item) => item.id === filters.sportId)?.name;
  return (
    <div className={styles.filterSummary}>
      <span>
        {sport || copy.allSports}
        {filters.date && <span> / {filters.date}</span>}
      </span>
      <button type="button" className={styles.filterButton} onClick={open}>
        <Icon name="filter" size={16} />
        {copy.filters}
        {count > 0 && <span className={styles.filterCount}>{count}</span>}
      </button>
    </div>
  );
}
