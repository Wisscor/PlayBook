import type { ReactNode } from "react";
import Image from "next/image";
import styles from "./community.module.css";

export function Icon({
  name,
  size = 20,
}: {
  name:
    | "search"
    | "filter"
    | "users"
    | "calendar"
    | "chat"
    | "post"
    | "chevron"
    | "close"
    | "check";
  size?: number;
}) {
  const paths: Record<typeof name, ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    filter: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-3-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M8 3v4m8-4v4M4 11h16M8 15h3m-3 3h5" />
      </>
    ),
    chat: <path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z" />,
    post: (
      <>
        <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M15 3l6 6M10 14l2-6 5-5 6 6-5 5-6 2Z" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Avatar({
  name,
  src,
  large = false,
}: {
  name: string;
  src?: string;
  large?: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("") || "P";
  const url =
    src &&
    (/^https?:\/\//.test(src)
      ? src
      : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/${src.replace(/^\//, "")}`);
  return (
    <span className={styles.avatar} data-large={large}>
      <span aria-hidden="true">{initials}</span>
      {url && (
        <Image
          src={url}
          alt=""
          width={64}
          height={64}
          unoptimized
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export function Court() {
  return (
    <svg
      className={styles.court}
      viewBox="0 0 410 240"
      fill="none"
      aria-hidden="true"
    >
      <g
        transform="translate(38 26) rotate(-9 170 100)"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <rect x="8" y="8" width="320" height="190" rx="2" />
        <path d="M168 8v190M8 46h52v114H8m320-114h-52v114h52" />
        <circle cx="168" cy="103" r="34" />
        <path d="M8 17a86 86 0 0 1 0 172m320-172a86 86 0 0 0 0 172M8 83h22v40H8m320-40h-22v40h22" />
        <circle cx="289" cy="45" r="11" fill="#e8a66e" stroke="#e8a66e" />
        <path d="m283 36 12 18m-15-10 19 2" stroke="#102b3f" />
      </g>
    </svg>
  );
}

export function Pagination({
  page,
  pages,
  previous,
  next,
  onChange,
  label,
}: {
  page: number;
  pages: number;
  previous: string;
  next: string;
  onChange: (page: number) => void;
  label: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label={label}>
      <button
        type="button"
        aria-label={previous}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <span className={styles.previousIcon}>
          <Icon name="chevron" size={16} />
        </span>
      </button>
      <span>
        {page} / {pages}
      </span>
      <button
        type="button"
        aria-label={next}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevron" size={16} />
      </button>
    </nav>
  );
}

export type MatchFilters = {
  sportId: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
};
export const emptyFilters: MatchFilters = {
  sportId: "",
  status: "",
  date: "",
  startTime: "",
  endTime: "",
};
