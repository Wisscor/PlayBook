import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/lib/constants";
import { api } from "@/services/api";
import axios from "axios";
import { useTranslations } from "next-intl";
import React from "react";

export const SignUp = () => {
  const { goSignIn } = useNavigation();
  const t = useTranslations();
  const [infos, setInfos] = React.useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "", 
    password: "",
    confirmPassword: "",
  });
  const [isHidden, setIsHidden] = React.useState({
    original: true,
    confirm: true,
  });
  const [error, setError] = React.useState<string | null>(null);

  const getSignupError = () =>
    t.has("signup-error")
      ? t("signup-error")
      : "Unable to create your account. Please try again.";

  const handleSubmit = async () => {
    setError(null);

    if (infos.password !== infos.confirmPassword) {
      setError(t("password-mismatch"));
      return;
    }

    try {
      await api.post("/auth/signup", {
        firstname: infos.firstName,
        lastname: infos.lastName,
        username: infos.username,
        email: infos.email,
        password: infos.password,
      });
      goSignIn();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          setError(detail[0].msg);
        } else {
          setError(getSignupError());
        }
      } else {
        setError(getSignupError());
      }
    }
  };

  return (
    <div className="px-10 lg:mx-15 py-11 lg:px-0 lg:py-0 overflow-hidden rounded-t-3xl lg:rounded-b-3xl flex flex-col lg:flex-row gap-10 lg:gap-0 items-center lg:items-stretch justify-center bg-linear-to-b from-secondary via-extra to-primary">
      <div className="flex lg:flex-1  flex-col gap-10  lg:items-stretch  justify-center  w-full lg:bg-white lg:px-10 lg:py-8">
        <PlayText.Primary
          id="signUp"
          className="text-3xl text-center lg:text-black "
        />
        <div className="gap-10 flex-col flex">
          <div className="gap-10 flex items-center">
            <PlayInput.Primary
              className="lg:bg-primary/20 lg:text-primary"
              placeholder="firstName"
              value={infos.firstName}
              onChange={(e) =>
                setInfos({ ...infos, firstName: e.target.value })
              }
            />
            <PlayInput.Primary
              className="lg:bg-primary/20 lg:text-primary"
              placeholder="lastName"
              value={infos.lastName}
              onChange={(e) => setInfos({ ...infos, lastName: e.target.value })}
            />
          </div>
          <PlayInput.Primary
            className="lg:bg-primary/20 lg:text-primary"
            placeholder="username"
            value={infos.username}
            onChange={(e) => setInfos({ ...infos, username: e.target.value })}
          />
          <PlayInput.Primary
            className="lg:bg-primary/20 lg:text-primary"
            placeholder="email"
            type="email"
            value={infos.email}
            onChange={(e) => setInfos({ ...infos, email: e.target.value })}
          />
          <PlayInput.Password
            className="lg:bg-primary/20 lg:text-primary"
            onClick={() => {
              setIsHidden({ ...isHidden, original: !isHidden.original });
            }}
            isHidden={isHidden.original}
            placeholder="password"
            value={infos.password}
            onChange={(e) => setInfos({ ...infos, password: e.target.value })}
          />
          <PlayInput.Password
            className="lg:bg-primary/20 lg:text-primary"
            onClick={() => {
              setIsHidden({ ...isHidden, confirm: !isHidden.confirm });
            }}
            isHidden={isHidden.confirm}
            placeholder="confirm-password"
            value={infos.confirmPassword}
            onChange={(e) =>
              setInfos({ ...infos, confirmPassword: e.target.value })
            }
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
            title="create-account"
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

      <div className="bg-linear-to-b hidden lg:flex-1 from-darkBrown to-primary flex-col lg:flex items-center justify-center gap-10 px-15 ">
        <PlayText.Primary
          id="welcome-message"
          className="text-3xl text-center "
        />
        <PlayText.Span
          className="text-sm text-center"
          texts={[
            {
              text: "already-have-account",
            },
            {
              text: "login",
              className: "text-black underline",
              path: ROUTES.SIGNIN,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default SignUp;
