"use client";

import { Header } from "@/components/shared/Header";
import { PlayButton } from "@/components/ui/Button";
import { PlayText } from "@/components/ui/Text";
import { useResize } from "@/hooks/contexts/resizeContext";
import { ROUTES } from "@/lib/constants";
import { Link } from "../../../i18n/navigation";

export const Home = () => {
  const { windowWidth } = useResize();
  return (
    <div className=" lg:bg-[url('/images/bg-app.png')] lg:bg-cover lg:bg-no-repeat lg:bg-center bg-linear-to-b from-secondary via-extra to-primary flex-col flex-1 flex h-screen px-10 lg:px-30 py-11 lg:py-20 ">
      <main className="flex-1 justify-between flex flex-col  ">
        <Header />

        <div className="flex-1 flex-col justify-center 2xl:px-60   flex ">
          <div
            className={`flex flex-col lg:flex-row   justify-between ${windowWidth < 1024 && "flex-1"}    lg:rounded-4xl drop-shadow-2xl lg:bg-white100 overflow-hidden`}
          >
            <div className="text-center gap-2.5 flex-col flex  justify-center flex-1 lg:bg-linear-to-b lg:from-secondary lg:via-extra lg:to-primary items-center lg:px-9 ">
              <PlayText.Primary
                id="welcome"
                className=" text-2xl lg:text-3xl font-bold "
              />
              <PlayText.Primary id="slogan" className="text-lg lg:text-xl" />
            </div>

            <div className="lg:flex-1 lg:bg-secondary lg:px-9 lg:pt-38 lg:pb-15 ">
              <PlayButton.Primary title="continue-intra" />
              <div className="flex items-center gap-2.5 mt-4">
                <div className="flex-1 h-px bg-white100 " />
                <PlayText.Primary id="or" className="text-[16px] lg:text-xl " />
                <div className="flex-1 h-px bg-white100 " />
              </div>
              <div className="flex flex-col lg:flex-row gap-4 mt-4">
                <Link href={ROUTES.SIGNUP} className="w-full">
                  <PlayButton.Secondary
                    title="signup"
                    textClassName="text-white"
                  />
                </Link>
                <Link href={ROUTES.SIGNIN} className="w-full">
                  <PlayButton.Primary title="login" />
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
