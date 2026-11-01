"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { isEmailValid } from "@/lib/utils";
import { useAuthController } from "@/services/auth";
import { SignInData } from "@/types/api";
import React, { useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-neutral-950/40 text-stone-100 placeholder-stone-500 backdrop-blur-md transition-all duration-300 hover:border-white/20 focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30";

export const SignIn: React.FC = () => {
  const { signIn, isWaiting } = useAuthController();

  const [infos, setInfos] = useState<SignInData>({
    email: "",
    password: "",
  });
  const [isHidden, setIsHidden] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleLogin = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (error) return;

    if (!isEmailValid(infos.email)) {
      setError("email-invalid");
      return;
    }
    setError(undefined);
    void signIn(infos, () => {
      setError("error-credentials");
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1.5 rounded-full bg-linear-to-b from-primary to-extra" />
        <PlayText.Primary
          id="login"
          className="text-2xl font-extrabold tracking-tight text-stone-100 sm:text-3xl"
        />
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <PlayInput.Primary
            autoComplete="email"
            onInputClick={() => {
              setError(undefined);
            }}
            onBlur={() => {
              if (!isEmailValid(infos.email)) {
                setError("email-invalid");
              }
            }}
            className={inputClass}
            placeholder="email"
            value={infos.email}
            onChange={(e) => setInfos({ ...infos, email: e.target.value })}
          />
          <PlayInput.Password
            autoComplete="current-password"
            onInputClick={() => {
              setError(undefined);
            }}
            className={inputClass}
            onClick={() => setIsHidden(!isHidden)}
            isHidden={isHidden}
            placeholder="password"
            value={infos.password}
            onChange={(e) => setInfos({ ...infos, password: e.target.value })}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3"
          >
            <PlayText.Primary id={error} className="text-sm text-rose-300" />
          </div>
        )}

        <PlayButton.Primary
          textClassName="text-white font-semibold"
          title={isWaiting ? "logging-in" : "login"}
          className="w-full rounded-2xl py-3.5 shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-60"
          type="submit"
        />
      </form>

      <div className="border-t border-white/10 pt-5 text-center">
        <PlayText.Span
          className="text-sm text-stone-400"
          texts={[
            {
              text: "are-you-new",
            },
            {
              text: "signup-now",
              className:
                "font-semibold text-amber-200 underline-offset-4 transition-colors hover:text-amber-100 hover:underline",
              path: ROUTES.SIGNUP,
            },
          ]}
        />
      </div>
    </div>
  );
};
