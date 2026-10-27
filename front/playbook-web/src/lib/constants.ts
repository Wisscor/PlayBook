export const languages = [
  {
    id: 0,
    name: "french",
    flag: "/icons/france.png",
    value: "fr",
  },
  {
    id: 1,
    name: "english",
    flag: "/icons/uk.png",
    value: "en",
  },
  {
    id: 2,
    name: "arabic",
    flag: "/icons/saudi.png",
    value: "ar",
  },
];

export const ROUTES = {
  ROOT: "/",
  SIGNIN: "/auth?mode=signin",
  SIGNUP: "/auth?mode=signup",
  POSTS: "/history?type=posts",
  MATCHES: "/history?type=matches",
  EDIT_PROFILE: "/edit-profile",
  PROFILE: "/profile",
  COMMUNITY: "/community",
  HOME: "/home",
  USER_PROFILE: "/user-profile",
  SEARCH: "/search",
  MESSAGES: "/messages",
  FOLLOWERS: "/followers",
} as const;

export enum COMING_FROM {
  ME = "me",
  OTHER = "other",
}

export const pageSize = 1;
