import { Link } from "../../../../../../i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { User } from "@/types/user";
import { useNavigation } from "@/hooks/useNavigation";
import { useCommunityCopy } from "../community-copy";
import { Avatar, Icon } from "../community-ui";
import styles from "../community.module.css";

export function LeftSideSection({ user }: { user?: User }) {
  const { copy } = useCommunityCopy();
  const { goProfile, goMessages, goFollowers } = useNavigation();
  const name =
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") || copy.profile;
  return (
    <aside className={styles.profileRail} aria-label={copy.profile}>
      <div className={styles.profileIdentity}>
        <button type="button" onClick={goProfile} aria-label={copy.viewProfile}>
          <Avatar name={name} src={user?.avatar} large />
        </button>
        <button
          type="button"
          className={styles.profileName}
          onClick={goProfile}
        >
          {name}
        </button>
        {user?.username && (
          <span className={styles.username}>@{user.username}</span>
        )}
        {user?.bio && <p className={styles.bio}>{user.bio}</p>}
      </div>
      <div className={styles.profileStats}>
        <button
          type="button"
          onClick={() => goFollowers("followers", user?.id)}
        >
          <strong>{user?.followers_count ?? 0}</strong>
          <span>{copy.followers}</span>
        </button>
        <button
          type="button"
          onClick={() => goFollowers("following", user?.id)}
        >
          <strong>{user?.following_count ?? 0}</strong>
          <span>{copy.following}</span>
        </button>
      </div>
      <nav className={styles.profileLinks} aria-label={copy.profile}>
        <Link href={ROUTES.MATCHES}>
          <Icon name="calendar" />
          {copy.myGames}
        </Link>
        <Link href={ROUTES.POSTS}>
          <Icon name="post" />
          {copy.myPosts}
        </Link>
        <button type="button" onClick={() => goMessages()}>
          <Icon name="chat" />
          {copy.messages}
        </button>
      </nav>
      <div className={styles.clubNote}>
        <Icon name="users" size={24} />
        <h3>{copy.communityNote}</h3>
        <p>{copy.communityNoteBody}</p>
      </div>
    </aside>
  );
}
