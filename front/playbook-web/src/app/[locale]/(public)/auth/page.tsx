"use client";

import { Header } from "@/components/shared/Header";
import { useSearchParams } from "next/navigation";
import { SignIn } from "./components/signIn";
import { SignUp } from "./components/signUp";

export const AuthPage = () => {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "signin";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-b from-secondary via-extra to-primary px-6 py-8 md:px-12 lg:px-20 lg:py-12">
      <main className="relative z-10 flex flex-1 flex-col justify-between">
        <div className="w-full">
          <Header />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          {mode === "signin" ? <SignIn /> : <SignUp />}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
