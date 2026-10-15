import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/lib/constants";
import { api } from "@/services/api";
import axios from "axios";
import { useTranslations } from "next-intl";
import React from "react";

export const SignIn = () => {
  const { goHome } = useNavigation();
  const t = useTranslations();
  const [infos, setInfos] = React.useState({
    username: "",
    password: "",
  });
  const [isHidden, setIsHidden] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    try {
      await api.post("/auth/login", {
        username_or_email: infos.username,
        password: infos.password,
      });
      goHome();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        setError(typeof detail === "string" ? detail : t("login-error"));
      } else {
        setError(t("login-error"));
      }
    }
  };

  return (
    <div className="px-10 lg:mx-15 py-11 lg:px-0 lg:py-0 overflow-hidden rounded-t-3xl lg:rounded-b-3xl flex flex-col lg:flex-row gap-10 lg:gap-0 items-center lg:items-stretch justify-center bg-linear-to-b from-secondary via-extra to-primary">
      <div className="bg-linear-to-b hidden lg:flex-1 from-darkBrown to-primary flex-col lg:flex items-center justify-center gap-10 px-15 ">
        <PlayText.Primary id="welcome" className="text-3xl text-center " />
        <PlayText.Span
          className="text-sm text-center"
          texts={[
            {
              text: "are-you-new",
            },
            {
              text: "signup-now",
              className: "text-black underline",
              path: ROUTES.SIGNUP,
            },
          ]}
        />
      </div>

      <div className="flex lg:flex-1  flex-col gap-10  lg:items-stretch  justify-center  w-full lg:bg-white lg:px-35 lg:py-16">
        <PlayText.Primary
          id="login"
          className="text-3xl text-center lg:text-black "
        />
        <div className="gap-10 flex-col flex">
          <PlayInput.Primary
            className="lg:bg-primary/20 lg:text-primary"
            placeholder="username"
            value={infos.username}
            onChange={(e) => setInfos({ ...infos, username: e.target.value })}
          />
          <PlayInput.Password
            className="lg:bg-primary/20 lg:text-primary"
            onClick={() => {
              setIsHidden(!isHidden);
            }}
            isHidden={isHidden}
            placeholder="password"
            value={infos.password}
            onChange={(e) => setInfos({ ...infos, password: e.target.value })}
          />
        </div>
        <PlayText.Span
          className="lg:hidden text-center justify-center"
          texts={[
            {
              text: "are-you-new",
            },
            {
              text: "signup-now",
              className: "text-black underline",
              path: ROUTES.SIGNUP,
            },
          ]}
        />
        <div className="w-full  px-5 lg:px-25">
          <PlayButton.Primary
            textClassName="lg:text-white"
            title="login"
            className=" justify-center self-center lg:bg-primary "
            onClick={handleSubmit}
          />
        </div>
        {error && (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default SignIn;
