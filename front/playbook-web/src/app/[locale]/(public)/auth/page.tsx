"use client";

import { Header } from "@/components/shared/Header";
import { useSearchParams } from "next/navigation";
import SignIn from "./components/signIn";
import SignUp from "./components/signUp";

export const AuthPage = () => {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") ?? "signin";

  return (
    <div className=" bg-[url('/images/bg-app.png')] bg-cover bg-no-repeat bg-center   flex-col flex-1 flex h-screen lg:px-30 lg:py-20   ">
      <main className="flex-1 justify-between flex flex-col  ">
        <div className="px-10 lg:px-0 py-11 lg:py-0">
          <Header />
        </div>

        {mode === "signin" ? <SignIn /> : <SignUp />}
      </main>
    </div>
  );
};

export default AuthPage;
