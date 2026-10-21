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
    //TODO: khassna n3rfou kifach ndirou had lroute li kayn f ROUTES.USER_PROFILE wash id oula username (security concern)
    goUserProfile: (userId: string) =>
      push(`${ROUTES.USER_PROFILE}?id=${userId}`),
  };
};
