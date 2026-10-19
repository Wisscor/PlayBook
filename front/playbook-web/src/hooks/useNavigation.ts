import { useRouter } from "../../i18n/navigation";

export const useNavigation = () => {
  const { push } = useRouter();

  return {
    goHome: () => push("/home"),
    goAuth: () => push("/auth"),
    goSignUp: () => push("/auth?mode=signup"),
    goSignIn: () => push("/auth?mode=signin"),
    goProfile: () => push("/profile"),
  };
};
