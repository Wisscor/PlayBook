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
  HOME: "/",
  SIGNIN: "/auth?mode=signin",
  SIGNUP: "/auth?mode=signup",
  POSTS: "/history?type=posts",
  MATCHES: "/history?type=matches",
  PROFILE: "/profile",
} as const;
