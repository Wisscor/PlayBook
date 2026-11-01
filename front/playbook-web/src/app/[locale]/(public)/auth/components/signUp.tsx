"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { isEmailValid } from "@/lib/utils";
import { useAuthController } from "@/services/auth";
import React, { useState } from "react";

export const SignUp: React.FC = () => {
  const { signUp, isWaiting } = useAuthController();
  const [infos, setInfos] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | undefined>(undefined);
  const [isHidden, setIsHidden] = useState({
    original: true,
    confirm: true,
  });

  const handleSignUp = (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(undefined);
    if (
      !infos.firstName ||
      !infos.lastName ||
      !infos.username ||
      !infos.email ||
      !infos.password ||
      !infos.confirmPassword
    ) {
      setError("all-fields-required");
      return;
    }
    if (!isEmailValid(infos.email)) {
      setError("email-invalid");
      return;
    }
    if (infos.password !== infos.confirmPassword) {
      setError("passwords-do-not-match");
      return;
    }
    void signUp(
      {
        firstname: infos.firstName,
        lastname: infos.lastName,
        username: infos.username,
        email: infos.email,
        password: infos.password,
      },
      (msg) => {
        setError(msg || "error-creating-account");
      },
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1.5 rounded-full bg-linear-to-b from-primary to-extra" />
          <PlayText.Primary
            id="signUp"
            className="text-2xl font-extrabold tracking-tight text-stone-100 sm:text-3xl"
          />
        </div>
        <PlayText.Primary
          id="welcome-message"
          className="text-pretty text-sm leading-relaxed text-stone-400"
        />
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PlayInput.Primary
            name="firstName"
            autoComplete="given-name"
            onInputClick={() => {
              setError(undefined);
            }}
            placeholder="firstName"
            value={infos.firstName}
            onChange={(e) => setInfos({ ...infos, firstName: e.target.value })}
          />
          <PlayInput.Primary
            name="lastName"
            autoComplete="family-name"
            onInputClick={() => {
              setError(undefined);
            }}
            placeholder="lastName"
            value={infos.lastName}
            onChange={(e) => setInfos({ ...infos, lastName: e.target.value })}
          />
        </div>

        <PlayInput.Primary
          name="username"
          autoComplete="username"
          onInputClick={() => {
            setError(undefined);
          }}
          placeholder="username"
          value={infos.username}
          onChange={(e) => setInfos({ ...infos, username: e.target.value })}
        />

        <PlayInput.Primary
          name="email"
          autoComplete="email"
          onInputClick={() => {
            setError(undefined);
          }}
          onBlur={() => {
            if (!isEmailValid(infos.email)) {
              setError("email-invalid");
            }
          }}
          placeholder="email"
          type="email"
          value={infos.email}
          onChange={(e) => setInfos({ ...infos, email: e.target.value })}
        />

        <PlayInput.Password
          name="password"
          autoComplete="new-password"
          onInputClick={() => {
            setError(undefined);
          }}
          onClick={() =>
            setIsHidden({ ...isHidden, original: !isHidden.original })
          }
          isHidden={isHidden.original}
          placeholder="password"
          value={infos.password}
          onChange={(e) => setInfos({ ...infos, password: e.target.value })}
        />

        <PlayInput.Password
          name="confirmPassword"
          autoComplete="new-password"
          onInputClick={() => {
            setError(undefined);
          }}
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

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3"
          >
            <PlayText.Primary id={error} className="text-sm text-rose-300" />
          </div>
        )}

        <PlayButton.Primary
          title={isWaiting ? "signing-up" : "signUp"}
          textClassName="text-white font-semibold"
          className="mt-1 w-full rounded-2xl py-3.5 shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-60"
          type="submit"
        />
      </form>

      <div className="border-t border-white/10 pt-5 text-center">
        <PlayText.Span
          className="justify-center text-sm text-stone-400"
          texts={[
            {
              text: "already-have-account",
            },
            {
              text: "login",
              className:
                "font-semibold text-amber-200 underline-offset-4 transition-colors hover:text-amber-100 hover:underline",
              path: ROUTES.SIGNIN,
            },
          ]}
        />
      </div>
    </div>
  );
};
