"use client";

import { PlayButton } from "@/components/ui/Button";
import { PlayInput } from "@/components/ui/Input";
import { PlayText } from "@/components/ui/Text";
import { useNavigation } from "@/hooks/useNavigation";
import { ROUTES } from "@/lib/constants";
import { signIn } from "@/services/auth";
import React, { useState } from "react";

export const SignIn = () => {
  const { goHome } = useNavigation();
  const [infos, setInfos] = useState({
    username_or_email: "",
    password: "",
  });
  const [isHidden, setIsHidden] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signIn(infos);
      goHome();
    } catch {
      setError("Invalid username/email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 lg:grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center gap-6 bg-linear-to-b from-secondary/40 via-extra/20 to-primary/40 p-12 text-center">
        <PlayText.Primary
          id="welcome"
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        />
        <PlayText.Span
          className="text-sm text-slate-300"
          texts={[
            {
              text: "are-you-new",
            },
            {
              text: "signup-now",
              className:
                "text-white underline font-semibold hover:text-slate-200 transition-colors",
              path: ROUTES.SIGNUP,
            },
          ]}
        />
      </div>

      <div className="flex flex-col justify-center border-t border-white/10 bg-slate-950/40 p-8 lg:border-t-0 lg:border-l lg:p-12">
        <div className="mb-8 text-center lg:text-left">
          <PlayText.Primary
            id="login"
            className="text-2xl lg:text-3xl font-bold tracking-tight text-white"
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <PlayInput.Primary
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all"
              placeholder="username"
              value={infos.username_or_email}
              onChange={(e) =>
                setInfos({ ...infos, username_or_email: e.target.value })
              }
            />
            <PlayInput.Password
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-md focus:border-white/30 focus:outline-none transition-all"
              onClick={() => setIsHidden(!isHidden)}
              isHidden={isHidden}
              placeholder="password"
              value={infos.password}
              onChange={(e) => setInfos({ ...infos, password: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="pt-2">
            <PlayButton.Primary
              textClassName="text-slate-950 font-semibold"
              title={isLoading ? "logging-in" : "login"}
              className="w-full rounded-2xl bg-white py-3.5 shadow-lg shadow-white/5 hover:bg-slate-100 transition-all"
              type="submit"
            />
          </div>
        </form>

        <div className="mt-6 text-center lg:hidden">
          <PlayText.Span
            className="text-sm text-slate-300"
            texts={[
              {
                text: "are-you-new",
              },
              {
                text: "signup-now",
                className: "text-white underline font-semibold",
                path: ROUTES.SIGNUP,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
