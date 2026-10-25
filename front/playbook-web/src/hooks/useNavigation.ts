import { ROUTES } from "@/lib/constants";
import { useRouter } from "../../i18n/navigation";

export const useNavigation = () => {
  const { push } = useRouter();

  return {
    goHome: () => push(ROUTES.HOME),
    goSignIn: () => push(ROUTES.SIGNIN),
    goEdit: () => push(ROUTES.EDIT_PROFILE),
    goProfile: () => push(ROUTES.PROFILE),
    goCommunity: () => push(ROUTES.COMMUNITY),
    goMessages: () => push(ROUTES.MESSAGES),
    goSearch: () => push(ROUTES.SEARCH),
    goUserProfile: (userId: string) => {
      localStorage.setItem("userId", userId);
      push(`${ROUTES.USER_PROFILE}`);
    },
    goFollowers: (userId: string) => {
      localStorage.setItem("userid_of_requested_user_for_followers", userId);
      push(`${ROUTES.FOLLOWERS}`);
    },
  };
};
