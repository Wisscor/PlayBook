import { Header } from "@/components/shared/Header";
import { PlayText } from "@/components/ui/Text";
import { useTranslations } from "next-intl";
import React from "react";

export const PrivacyPage = () => {
  const t = useTranslations();
  const datasCollected = [
    {
      title: "identity-data",
      description: "identity-data-description",
    },
    {
      title: "contact-data",
      description: "contact-data-description",
    },
    {
      title: "profile-data",
      description: "profile-data-description",
    },
    {
      title: "technical-data",
      description: "technical-data-description",
    },
  ];

  const howWeUseData = [
    "to-register-and-manage-your-account",
    "to-facilitate-match-rooms",
    "to-manage-our-relationship-with-you",
  ];
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-b from-secondary via-extra to-primary px-6 py-8 md:px-12 lg:px-20 lg:py-12">
      <main className="relative z-10 flex flex-1 flex-col justify-between">
        <div className="w-full">
          <Header />
        </div>

        <div className="flex flex-col min-h-[calc(100vh-140px)]  text-white px-4 py-8 md:px-12 lg:px-20 gap-8">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6">
              <PlayText.Primary
                id="privacy-policy"
                className="text-3xl font-extrabold tracking-tight text-white"
              />

              <PlayText.Primary
                id="last-updated"
                values={{
                  date: "November 1, 2026",
                }}
                className="text-xs text-slate-400"
              />
            </div>

            <div className="flex flex-col gap-6 text-sm text-slate-300 leading-relaxed">
              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="introduction"
                  values={{
                    mark: "1",
                  }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Span
                  texts={[
                    {
                      text: "welcome-to",
                    },
                    {
                      content: "PlayBook",
                      className: "text-white font-semibold",
                    },
                    {
                      text: "we-respect-your-privacy",
                    },
                  ]}
                />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="data-we-collect"
                  values={{
                    mark: "2",
                  }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Primary id="data-we-collect-description" />
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                  {datasCollected.map((data) => {
                    return (
                      <li key={data.title}>
                        <span className="text-white font-semibold">
                          {t(data.title)}
                        </span>
                        {t(data.description)}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="how-we-use-your-data"
                  values={{
                    mark: "3",
                  }}
                  className="text-base font-bold text-white"
                />
                <PlayText.Primary
                  id="how-we-use-your-data-description"
                  className="text-base font-bold text-white"
                />

                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                  {howWeUseData.map((data) => {
                    return <li key={data}>{t(data)}</li>;
                  })}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl flex flex-col gap-3">
                <PlayText.Primary
                  id="contact-us"
                  values={{
                    mark: "4",
                  }}
                  className="text-base font-bold text-white"
                />

                <PlayText.Span
                  texts={[
                    {
                      text: "contact-us-description",
                    },
                    {
                      content: "+212631205288",
                      className: "text-sky-400 font-medium",
                    },
                  ]}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
