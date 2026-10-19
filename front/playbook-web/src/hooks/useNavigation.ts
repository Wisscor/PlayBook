import { ROUTES } from "@/lib/constants";
import { useRouter } from "../../i18n/navigation";

export const useNavigation = () => {
  const { push } = useRouter();

  return {
    goHome: () => push(ROUTES.HOME),
    goSignIn: () => push(ROUTES.SIGNIN),
    goEdit: () => push(ROUTES.EDIT_PROFILE),
    goProfile: () => push(ROUTES.PROFILE),
  };
};
