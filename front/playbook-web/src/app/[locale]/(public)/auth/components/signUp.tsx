"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import React, { useState } from "react";

export const SignUp = () => {
  const [infos, setInfos] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isHidden, setIsHidden] = useState({
    original: true,
    confirm: true,
  });

  const handleSignUp = (e: React.SubmitEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 lg:grid lg:grid-cols-2">
      <div className="flex flex-col justify-center border-b border-white/10 bg-slate-950/40 p-8 lg:border-b-0 lg:border-r lg:p-12">
        <div className="mb-8 text-center lg:text-left">
          <PlayText.Primary
            id="signUp"
            className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
          />
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PlayInput.Primary
              placeholder="firstName"
              value={infos.firstName}
              onChange={(e) =>
                setInfos({ ...infos, firstName: e.target.value })
              }
            />
            <PlayInput.Primary
              placeholder="lastName"
              value={infos.lastName}
              onChange={(e) => setInfos({ ...infos, lastName: e.target.value })}
            />
          </div>

          <PlayInput.Primary
            placeholder="username"
            value={infos.username}
            onChange={(e) => setInfos({ ...infos, username: e.target.value })}
          />

          <PlayInput.Password
            onClick={() =>
              setIsHidden({ ...isHidden, original: !isHidden.original })
            }
            isHidden={isHidden.original}
            placeholder="password"
            value={infos.password}
            onChange={(e) => setInfos({ ...infos, password: e.target.value })}
          />

          <PlayInput.Password
            onClick={() =>
              setIsHidden({ ...isHidden, confirm: !isHidden.confirm })
            }
            isHidden={isHidden.confirm}
            placeholder="confirm-password"
            value={infos.confirmPassword}
            onChange={(e) =>
              setInfos({ ...infos, confirmPassword: e.target.value })
            }
          />

          <div className="pt-2">
            <PlayButton.Primary
              title="signUp"
              className="w-full rounded-2xl bg-white py-3.5 shadow-lg shadow-white/5 hover:bg-slate-100 transition-all text-slate-950 font-semibold"
              type="submit"
            />
          </div>
        </form>

        <div className="mt-6 text-center lg:hidden">
          <PlayText.Span
            className="text-sm text-slate-300 justify-center"
            texts={[
              {
                text: "already-have-account",
              },
              {
                text: "login",
                className: "text-white underline font-semibold",
                path: ROUTES.SIGNIN,
              },
            ]}
          />
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center gap-6 bg-linear-to-b from-secondary/40 via-extra/20 to-primary/40 p-12 text-center">
        <PlayText.Primary
          id="welcome-message"
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        />
        <PlayText.Span
          className="text-sm text-slate-300 justify-center"
          texts={[
            {
              text: "already-have-account",
            },
            {
              text: "login",
              className:
                "text-white underline font-semibold hover:text-slate-200 transition-colors",
              path: ROUTES.SIGNIN,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default SignUp;
