"use client";

import { Header } from "@/components/shared/Header";
import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { ROUTES } from "@/lib/constants";
import { Link } from "../../../i18n/navigation";

export const Home = () => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 px-6 py-8 text-white md:px-12 lg:px-20 lg:py-12">
      <main className="relative z-10 flex flex-1 flex-col justify-between">
        <Header />

        <div className="my-auto flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/20 lg:grid lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 bg-linear-to-b from-secondary/40 via-extra/20 to-primary/40 p-8 text-center lg:p-12">
              <PlayText.Primary
                id="welcome"
                className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl bg-linear-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
              />
              <PlayText.Primary
                id="slogan"
                className="text-base text-slate-300 sm:text-lg font-medium"
              />
            </div>

            <div className="flex flex-col justify-center border-t border-white/10 bg-black/20 p-8 lg:border-t-0 lg:border-l lg:p-12">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href={ROUTES.SIGNUP} className="w-full">
                  <PlayButton.Secondary
                    title="signup"
                    textClassName="text-white"
                    className="w-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  />
                </Link>
                <Link href={ROUTES.SIGNIN} className="w-full">
                  <PlayButton.Primary title="login" className="w-full" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
